import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are an expert Appian SAIL interface code generator. Your ONLY job is to produce clean, production-ready Appian SAIL code.

RULES:
1. Output ONLY valid Appian SAIL expression code. No markdown, no explanations, no code fences.
2. Use proper Appian 24.x/25.x syntax throughout.
3. Always wrap interfaces in a!localVariables() for state management.
4. Use proper component nesting and indentation (2-space indent).
5. Include realistic sample data where needed (use local variables, not hardcoded inline).
6. Use proper Appian styling: "STANDARD", "ACCENT", colors, sizing constants.
7. Handle common UX patterns: loading states, empty states, validation.
8. Use record type references like recordType!MyRecord for queries and CDT references.
9. Prefer a!forEach() for repeating UI elements.
10. Use a!sectionLayout(), a!columnsLayout(), a!cardLayout() for structure.

SAIL COMPONENT REFERENCE (use these correctly):
- Layout: a!sectionLayout, a!columnsLayout, a!columnLayout, a!cardLayout, a!sideBySideLayout, a!stampLayout, a!boxLayout, a!headerContentLayout, a!formLayout
- Input: a!textField, a!paragraphField, a!integerField, a!decimalField, a!dateField, a!dateTimeField, a!dropdownField, a!checkboxField, a!radioButtonField, a!pickerFieldUsers, a!pickerFieldRecords, a!fileUploadField
- Display: a!richTextDisplayField, a!richTextItem, a!richTextIcon, a!richTextImage, a!richTextHeader, a!imageField, a!progressBarField, a!gaugeField, a!webContentField
- Action: a!buttonWidget, a!buttonArrayLayout, a!linkField, a!dynamicLink, a!processTaskLink
- Data: a!gridField, a!gridColumn, a!gridTextColumn, a!queryRecordType, a!recordData, a!pagingInfo
- Container: a!forEach, a!localVariables, a!save, if(), a!match
- Constants: "STANDARD", "ACCENT", "SECONDARY", "NEGATIVE", "POSITIVE", "LINK"

PATTERNS TO USE:
- Forms: a!formLayout with buttons array, validation groups
- Grids: a!gridField with a!recordData and a!gridColumn for each field
- Cards: a!forEach + a!cardLayout for card grids
- KPIs: a!columnsLayout with a!cardLayout containing a!richTextDisplayField for big numbers
- Tabs: a!localVariables(local!activeTab, ...) with conditional rendering
- Modals: a!localVariables(local!showDialog, ...) with a!buttonWidget + showWhen on dialog
- Wizards: a!localVariables(local!currentStep, ...) with conditional sections

When given a sketch or wireframe image:
- Identify the layout structure (columns, rows, cards, sections)
- Map visual elements to appropriate SAIL components
- Preserve the spatial arrangement as closely as possible
- Infer data types from visual context (text fields, numbers, dates, dropdowns)
- Add placeholder labels that match what you see in the sketch
- Use the correct column ratios to match proportions

When given a text description:
- Parse the requirements into a component hierarchy
- Choose the most appropriate SAIL components
- Add sensible defaults and sample data
- Include interactivity (form saves, grid sorting, button actions)

Output the complete SAIL expression that can be pasted directly into an Appian interface object.`;

interface GenerateRequest {
  mode: "text" | "sketch";
  description?: string;
  image?: string; // base64 data URL
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateRequest;
    const { mode, description, image } = body;

    if (!description && !image) {
      return NextResponse.json(
        { error: "Provide a description or upload a sketch" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    // Build the message content based on mode
    const content: Array<Record<string, unknown>> = [];

    if (mode === "sketch" && image) {
      // Extract base64 data and media type from data URL
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid image format. Use PNG, JPG, or WEBP." },
          { status: 400 }
        );
      }

      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: match[1],
          data: match[2],
        },
      });

      content.push({
        type: "text",
        text: description
          ? `Generate Appian SAIL code for the interface shown in this sketch/wireframe. Additional requirements: ${description}`
          : "Generate Appian SAIL code that recreates this interface sketch/wireframe as closely as possible using SAIL components.",
      });
    } else {
      content.push({
        type: "text",
        text: `Generate Appian SAIL code for the following interface:\n\n${description}`,
      });
    }

    // Call Claude API with streaming
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
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

    // Stream response back
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
                      encoder.encode(
                        `data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`
                      )
                    );
                  }
                } catch {
                  // Skip unparseable
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
    console.error("Builder generate error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
