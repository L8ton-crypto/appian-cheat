import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are an expert Appian Data Fabric architect. Given a business scenario, output a complete Data Fabric configuration recommendation.

Your response MUST follow this exact structure with markdown headers:

## Data Model Overview
Brief summary of the recommended architecture.

## Database Tables
For each table, provide:
- Table name (snake_case, prefixed with the app abbreviation)
- Column definitions with types (NUMBER, VARCHAR, BOOLEAN, TIMESTAMP, DATE)
- Primary keys, foreign keys, indexes
- Use this exact format for each table:

\`\`\`sql
CREATE TABLE prefix_table_name (
  id NUMBER PRIMARY KEY AUTO_INCREMENT,
  column_name TYPE NOT NULL,
  foreign_id NUMBER REFERENCES prefix_other_table(id),
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_table_column ON prefix_table_name(column_name);
\`\`\`

## Record Types
For each record type, provide:
- Record type name (PascalCase, e.g. "HR Employee")
- Source table
- Record type description
- Key fields to display

SAIL snippet format:
\`\`\`sail
/* Record Type: RecordTypeName */
/* Source: prefix_table_name */
/* Display Field: column_name */
\`\`\`

## Relationships
For each relationship between record types:
- Parent record type
- Related record type  
- Relationship type: one-to-one, one-to-many, or many-to-many
- Foreign key field
- Common filter (if applicable)

Use this format:
\`\`\`sail
/* Relationship: ParentType -> RelatedType */
/* Type: one-to-many */
/* Foreign Key: parent_id on child_table */
/* Use: a!relatedRecordData() for queries */
\`\`\`

## Expression Rules
Provide key expression rules needed for common operations:
\`\`\`sail
/* Rule: rule!PREFIX_GetActiveRecords */
a!queryRecordType(
  recordType: 'recordType!{PREFIX_RecordType}',
  filters: a!queryFilter(
    field: 'recordType!{PREFIX_RecordType}.fields.{status}',
    operator: "=",
    value: "ACTIVE"
  ),
  pagingInfo: a!pagingInfo(
    startIndex: 1,
    batchSize: -1,
    sort: a!sortInfo(
      field: 'recordType!{PREFIX_RecordType}.fields.{created_on}',
      ascending: false()
    )
  )
).data
\`\`\`

## Interface Patterns
Suggest 2-3 key interface patterns using record-powered grids and views:
\`\`\`sail
/* Pattern: Record Grid with Related Data */
a!gridField(
  label: "Records",
  labelPosition: "ABOVE",
  data: 'recordType!{PREFIX_RecordType}',
  columns: {
    a!gridColumn(label: "Name", sortField: 'recordType!{PREFIX_RecordType}.fields.{name}', value: fv!row['recordType!{PREFIX_RecordType}.fields.{name}']),
    a!gridColumn(label: "Status", sortField: 'recordType!{PREFIX_RecordType}.fields.{status}', value: fv!row['recordType!{PREFIX_RecordType}.fields.{status}'])
  },
  rowHeader: 1
)
\`\`\`

## Best Practices & Warnings
- Specific advice for this use case
- Performance considerations
- Common pitfalls to avoid
- Sync schedule recommendations

RULES:
1. Use REAL Appian syntax - a!queryRecordType, a!relatedRecordData, record type references with recordType! prefix
2. Always include created_on and modified_on timestamp columns
3. Always suggest appropriate indexes for foreign keys and commonly queried fields
4. Table names should use a consistent app prefix (derive from the scenario)
5. Recommend sync schedule based on data volume expectations
6. If the scenario involves large datasets (>100k rows), recommend record type sync with custom source filters
7. For many-to-many relationships, always create a junction table
8. Include data type recommendations that map to Appian CDT types (NUMBER->Number, VARCHAR->Text, BOOLEAN->Boolean, TIMESTAMP->Date and Time, DATE->Date)
9. Generate production-ready patterns - no placeholders or "TODO" comments
10. Always include at least one expression rule for the most common query pattern`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenario, tables, relationships, dataVolume, syncFrequency } = body;

    if (!scenario || typeof scenario !== "string" || scenario.trim().length < 10) {
      return Response.json(
        { error: "Please describe your business scenario in at least 10 characters." },
        { status: 400 }
      );
    }

    const userPrompt = buildUserPrompt(scenario, tables, relationships, dataVolume, syncFrequency);

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
        max_tokens: 4096,
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
    console.error("Data Fabric Wizard error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildUserPrompt(
  scenario: string,
  tables?: string,
  relationships?: string,
  dataVolume?: string,
  syncFrequency?: string
): string {
  let prompt = `Business Scenario:\n${scenario}\n`;

  if (tables && tables.trim()) {
    prompt += `\nExisting Tables/Entities (if any):\n${tables}\n`;
  }

  if (relationships && relationships.trim()) {
    prompt += `\nKnown Relationships:\n${relationships}\n`;
  }

  if (dataVolume) {
    prompt += `\nExpected Data Volume: ${dataVolume}\n`;
  }

  if (syncFrequency) {
    prompt += `\nPreferred Sync Frequency: ${syncFrequency}\n`;
  }

  prompt += `\nGenerate a complete Appian Data Fabric architecture for this scenario. Include all tables, record types, relationships, expression rules, and interface patterns.`;

  return prompt;
}
