import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are an expert Appian process model architect and performance consultant. Given a process model description or XML, analyze it thoroughly and provide actionable recommendations.

Your response MUST follow this exact structure with markdown headers:

## Process Overview
Brief summary of what the process does, its complexity level (Simple/Moderate/Complex/Enterprise), and estimated node count.

## Architecture Assessment
- Overall design quality rating (1-10)
- Whether it follows Appian best practices
- Process model type classification (synchronous, asynchronous, sub-process, scheduled)

## Performance Analysis
For each identified performance concern:
- What the issue is
- Why it impacts performance
- Specific fix with code/config example

Common issues to check:
- Unnecessary database writes in loops
- Missing process model security (PM Security)
- Synchronous sub-processes that should be async
- Large data passed between nodes unnecessarily
- Missing error handling (no catch blocks or escalations)
- Timer events without proper cleanup
- Write-to-data-store nodes inside forEach loops (should use batch writes)
- Process variables carrying entire record sets instead of IDs

\`\`\`sail
/* Example Fix: Batch Write Instead of Loop */
/* BEFORE (slow - N database calls): */
a!forEach(
  items: local!records,
  expression: a!writeToDataStoreEntity(
    dataStoreEntity: cons!DS_ENTITY,
    valueToStore: fv!item,
    onSuccess: {}
  )
)

/* AFTER (fast - 1 database call): */
a!writeToDataStoreEntity(
  dataStoreEntity: cons!DS_ENTITY,
  valueToStore: local!records,
  onSuccess: {}
)
\`\`\`

## Best Practice Violations
For each violation found:
- Rule name (e.g. "SAIL-001: Avoid nested a!forEach")
- Severity: Critical / Warning / Info
- Current implementation
- Recommended fix

Check for these common violations:
- PROC-001: Process models should complete in under 30 seconds for user-facing flows
- PROC-002: Use sub-processes for reusable logic (DRY principle)
- PROC-003: Always include error handling nodes (MNI catch events)
- PROC-004: Use process model folders for organization
- PROC-005: Limit process variables - only carry what's needed
- PROC-006: Use record actions instead of standalone process models for simple CRUD
- PROC-007: Avoid smart services in parallel gateways unless truly independent
- PROC-008: Set process cleanup settings (auto-archive after completion)
- PROC-009: Use constants for repeated values, not hardcoded strings
- PROC-010: Gateway conditions should be exhaustive with a default branch
- SAIL-001: Avoid nested a!forEach - flatten with a!queryRecordType joins
- SAIL-002: Use a!localVariables instead of load() for expression rules
- SAIL-003: Use a!save instead of multiple a!writeToDataStoreEntity calls
- SAIL-004: Minimize interface re-evaluation with a!refreshVariable
- DATA-001: Use record types with sync instead of a!queryEntity
- DATA-002: Index foreign key columns
- DATA-003: Use a!queryRecordType pagingInfo for large datasets

## Optimization Recommendations
Numbered list of specific optimizations, ordered by impact (highest first):

1. **[HIGH IMPACT]** Description of change
   - Current behavior
   - Recommended change
   - Expected improvement

\`\`\`sail
/* Optimization: Example code showing the recommended approach */
\`\`\`

## Security Review
- Are process model permissions properly configured?
- Are sensitive operations behind proper group membership checks?
- Are there any data exposure risks through process variables?
- Recommendations for hardening

## Suggested Refactoring
If the process would benefit from restructuring, provide:
- Recommended process model decomposition
- Which parts should be sub-processes
- Which parts should be expression rules
- Which parts should use record actions

## Summary Scorecard
Provide a final scorecard:
- Performance: X/10
- Maintainability: X/10
- Error Handling: X/10
- Security: X/10
- Best Practices: X/10
- Overall: X/10

RULES:
1. Use REAL Appian syntax in all code examples
2. Be specific - reference actual Appian functions, not generic advice
3. If XML is provided, parse the actual node structure and reference specific nodes
4. If a text description is provided, infer the likely implementation and flag potential issues
5. Always provide the "fix" code, not just the problem description
6. Rate severity honestly - don't inflate issues
7. Focus on actionable changes, not theoretical improvements
8. Reference Appian 25.4 capabilities (record actions, data fabric, AI skills)
9. If the process seems well-designed, say so - don't manufacture problems
10. For each recommendation, estimate effort: Quick Fix / Moderate / Significant Refactor`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input, inputType, context } = body;

    if (!input || typeof input !== "string" || input.trim().length < 20) {
      return Response.json(
        { error: "Please provide at least 20 characters describing your process model." },
        { status: 400 }
      );
    }

    const userPrompt = buildUserPrompt(input, inputType, context);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 12000,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return Response.json({ error: "AI service error" }, { status: 502 });
    }

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
                  if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`)
                    );
                  }
                } catch {
                  // skip unparseable
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
  } catch (err) {
    console.error("Process Optimizer error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildUserPrompt(
  input: string,
  inputType?: string,
  context?: string
): string {
  const type = inputType === "xml" ? "Process Model XML" : "Process Description";
  let prompt = `${type}:\n\`\`\`\n${input}\n\`\`\`\n`;

  if (context && context.trim()) {
    prompt += `\nAdditional Context:\n${context}\n`;
  }

  prompt += `\nAnalyze this Appian process model thoroughly. Identify performance issues, best practice violations, security concerns, and provide specific optimization recommendations with code examples.`;

  return prompt;
}
