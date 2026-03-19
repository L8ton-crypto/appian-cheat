import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const COLLECTION_ID = "7b86ae30-54ea-40bb-a7ca-df5340b9e683";
const HF_URL =
  "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function getQueryEmbedding(text: string): Promise<number[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.HF_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
  }

  const res = await fetch(HF_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return Array.isArray(data[0]) ? data[0] : data;
}

async function retrieveContext(query: string): Promise<string[]> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const embedding = await getQueryEmbedding(query);
    const embeddingStr = `[${embedding.join(",")}]`;

    const results = await sql`
      SELECT content, 1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM vl_documents
      WHERE collection_id = ${COLLECTION_ID}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT 8
    `;

    return results
      .filter((r: Record<string, unknown>) => Number(r.similarity) > 0.4)
      .map((r: Record<string, unknown>) => r.content as string);
  } catch (err) {
    console.error("RAG retrieval failed:", err);
    return [];
  }
}

const SYSTEM_PROMPT = `You are AppianCheat Assistant - an expert AI helper for Appian developers. You live inside the AppianCheat reference app.

Your expertise covers ALL aspects of Appian development:
- Expression functions (SAIL, text, array, date/time, logical, looping, mathematical, etc.)
- Interface design (SAIL components, layouts, forms, grids, cards)
- Process models (process design, gateways, timers, subprocesses, error handling)
- Record types (record types, record fields, record actions, record views, relationships, sync)
- Data management (CDTs, data stores, queries, a!queryRecordType, a!queryEntity)
- Connected systems (REST, OpenAPI, JDBC, pre-built integrations)
- Design patterns and best practices
- Common errors and troubleshooting
- Expression rules, decisions, constants
- Groups, users, security
- Plugins and connected system plugins
- Portals (external-facing Appian interfaces)
- Appian RPA and AI skills

Guidelines:
- Give practical, copy-pasteable code examples in Appian expression language
- Reference specific Appian functions by name (e.g. a!localVariables, a!forEach, a!queryRecordType)
- When showing SAIL code, use proper Appian syntax with correct indentation
- Be concise but thorough - developers want answers, not essays
- If you reference a function, mention its full syntax
- For complex topics, break down the approach step by step
- Always mention if something changed in recent Appian versions (24.x, 25.x)
- If you're not sure about a very specific detail, say so rather than guessing
- Use backticks for inline code and triple backticks for code blocks
- Keep responses focused - answer the question, give an example, mention gotchas`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI assistant is not configured. Missing API key." },
        { status: 503 }
      );
    }

    // Get the latest user message for RAG retrieval
    const latestUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!latestUserMessage) {
      return NextResponse.json({ error: "No user message found" }, { status: 400 });
    }

    // Retrieve relevant context from vector DB
    const contextDocs = await retrieveContext(latestUserMessage.content);

    // Build system prompt with retrieved context
    let systemPrompt = SYSTEM_PROMPT;
    if (contextDocs.length > 0) {
      systemPrompt += `\n\nRelevant reference material from the AppianCheat knowledge base:\n---\n${contextDocs.join("\n---\n")}\n---\nUse this reference material to inform your answers when relevant, but don't be limited to it.`;
    }

    // Call Claude API (streaming)
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-20250414",
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages.slice(-10), // Keep last 10 messages for context window
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", response.status, err);
      return NextResponse.json(
        { error: "AI service temporarily unavailable" },
        { status: 502 }
      );
    }

    // Stream the response back
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  if (
                    parsed.type === "content_block_delta" &&
                    parsed.delta?.type === "text_delta"
                  ) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`)
                    );
                  }
                } catch {
                  // Skip unparseable lines
                }
              }
            }
          }
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
