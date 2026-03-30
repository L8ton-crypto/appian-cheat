import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface DocumentationRequest {
  inventory?: string;  // Pre-parsed structured inventory (preferred)
  xml?: string;        // Raw XML fallback (legacy/paste mode)
  projectName?: string;
  level: "summary" | "standard" | "comprehensive";
}

const buildSystemPrompt = (level: "summary" | "standard" | "comprehensive") => {
  const basePrompt = `You are a senior Appian solution architect producing handover-quality documentation. You don't just LIST objects found in the XML - you EXPLAIN how the application works as a system.

YOUR ANALYSIS APPROACH:
1. First pass: identify every object (process models, expression rules, interfaces, CDTs, record types, constants, groups, sites, connected systems, integrations, decisions, web APIs)
2. Second pass: trace the RELATIONSHIPS between objects. Which process calls which expression rule? Which interface displays which record type? Which integration feeds which process?
3. Third pass: reconstruct the BUSINESS LOGIC. What does this application actually DO? What problem does it solve? Walk through the user journey from start to finish.

CRITICAL RULES:
- Don't just say "Process Model: PM_SubmitRequest exists". Explain what it does step by step: "When a user submits a request, PM_SubmitRequest fires. It first validates the input via ER_ValidateRequest, then creates a record in the Request table, assigns a task to the approver group via the Approvers group, and sends a notification. If the request value exceeds the threshold in CONST_APPROVAL_LIMIT, it routes to a senior approver instead."
- Trace the full flow. If a process calls a sub-process, follow it. If an expression rule references constants, explain what those constants control.
- Explain gateway logic in plain English: "At the approval gateway, if the manager approves, the flow continues to fulfillment. If rejected, it loops back to the requester with feedback."
- For interfaces, describe the USER EXPERIENCE, not just the components. "The dashboard shows a summary grid of open requests with status indicators. Users can click a row to open the detail view, which displays the full request form in read-only mode with an action bar for approve/reject."

APPIAN KNOWLEDGE TO APPLY:
- Identify common Appian patterns: Write Records smart service, a]!update pattern for CDT manipulation, todatasubset() for paging, queryRecordType() vs a!queryEntity()
- Flag anti-patterns if you spot them: unbounded queries, N+1 patterns in rule inputs, overly complex single expressions that should be decomposed
- Note record type relationships (1:1, 1:many, many:many) and how they're used
- Identify security patterns: record-level security rules, group-based permissions, process security
- Call out environment-specific configuration: constants that change per environment, connected system URLs, credential references

DOCUMENTATION STRUCTURE:

## Executive Summary
2-3 paragraphs explaining what this application does, who uses it, and why it exists. Written for a non-technical stakeholder.

## Architecture Overview
- Application pattern (task-based, case management, data entry, reporting, etc.)
- Layer breakdown with specific objects in each layer
- Include a Mermaid architecture diagram:
\`\`\`mermaid
graph TD
  A[Site/Portal] --> B[Interfaces]
  B --> C[Expression Rules]
  C --> D[Record Types]
  D --> E[Database]
  B --> F[Process Models]
  F --> G[Integrations]
\`\`\`

## Data Model
- Every CDT and record type with ALL fields, types, and purpose
- Relationships between entities shown as a Mermaid ER diagram:
\`\`\`mermaid
erDiagram
  REQUEST ||--o{ APPROVAL : "has"
  REQUEST }o--|| USER : "submitted by"
\`\`\`
- Explain what each entity represents in business terms
- Note any calculated fields, default values, or derived data

## Business Processes
For EACH process model, provide:
- **Purpose:** One sentence on what this process achieves
- **Trigger:** How/when this process starts (form submission, timer, sub-process call, web API)
- **Flow walkthrough:** Step-by-step narrative of the happy path, written in plain English
- **Decision points:** Every gateway explained with conditions and outcomes
- **Exception handling:** What happens when things go wrong
- **Integrations:** External systems touched and data exchanged
- **Mermaid flowchart** for complex processes:
\`\`\`mermaid
flowchart LR
  A[Start] --> B{Validate}
  B -->|Valid| C[Create Record]
  B -->|Invalid| D[Return Error]
  C --> E[Assign Task]
  E --> F{Approved?}
  F -->|Yes| G[Fulfill]
  F -->|No| H[Notify Requester]
\`\`\`

## User Interfaces
For each interface:
- **Type:** Form, report, dashboard, record view, related action
- **User experience:** What the user sees and can do, described as a walkthrough
- **Data sources:** Which record types and expression rules feed this interface
- **Actions available:** Buttons, links, form submissions and what they trigger
- **Conditional logic:** What shows/hides based on user role or data state

## Expression Rules & Business Logic
Group by functional area (validation, calculation, data access, utility, display formatting). For each:
- What it computes or returns
- Key inputs and their meaning
- Business rules encoded in the logic (thresholds, conditions, formulas)
- Which other objects depend on it

## Integrations & Connected Systems
- Each connected system: what external system, protocol (REST/SOAP/DB), authentication method
- Each integration object: endpoint, HTTP method, request/response structure
- Data mapping: what Appian fields map to what external fields
- Error handling approach
- Sequence diagram for complex integration flows:
\`\`\`mermaid
sequenceDiagram
  participant U as User
  participant A as Appian
  participant E as External API
  U->>A: Submit Form
  A->>E: POST /api/create
  E-->>A: 201 Created
  A-->>U: Confirmation
\`\`\`

## Security Model
- Group hierarchy and role definitions
- Record-level security: who can see/edit what and why
- Process permissions: who can start/interact with each process
- Interface visibility rules
- Admin vs standard user capabilities

## Object Dependency Map
- Which objects reference which (trace rule inputs, process nodes, interface components)
- Identify critical-path objects (changing these affects many things)
- Orphaned objects (defined but not referenced)
- Mermaid dependency graph for complex applications

## Configuration & Deployment
- Constants that need environment-specific values (URLs, thresholds, feature flags)
- Connected system credentials to configure
- Database tables/views required
- Groups to create and populate
- Post-deployment validation steps

## Recommendations
- Design improvements or refactoring suggestions
- Performance considerations (unbounded queries, heavy processes)
- Security hardening opportunities
- Maintainability improvements`;

  const levelInstructions = {
    summary: `
DOCUMENTATION LEVEL: SUMMARY
- Include Executive Summary and Architecture Overview only
- One Mermaid diagram for architecture
- Brief bullet points for data model and key processes
- Skip detailed inventories - focus on "what does this app do?"
- Target 1-2 pages`,

    standard: `
DOCUMENTATION LEVEL: STANDARD
- Include: Executive Summary, Architecture Overview, Data Model, Business Processes, Interfaces (grouped), Integration Map, Security Model, Recommendations
- Skip: detailed Object Dependency Map, full Configuration & Deployment checklists, individual expression rule listings
- Mermaid diagrams for architecture and data model only (skip process flowcharts to save space)
- Explain each major process as a narrative walkthrough (2-3 sentences each)
- Group expression rules by area with counts, only detail the most important ones
- Be concise - target 4-6 pages`,

    comprehensive: `
DOCUMENTATION LEVEL: COMPREHENSIVE
- Maximum detail in every section - this is a full technical handover document
- Mermaid diagrams throughout: architecture, ER, every process flow, integration sequences, dependency graphs
- Every expression rule documented with inputs, outputs, and logic explanation
- Code snippets for complex SAIL patterns, notable expression rules, and integration mappings
- Performance analysis and optimisation recommendations
- Full dependency matrix
- Troubleshooting guide for common failure scenarios
- Target 15+ pages`
  };

  return basePrompt + "\n\n" + levelInstructions[level] + `

OUTPUT FORMAT:
- Clean markdown with clear ## section headers
- Use Mermaid code blocks for diagrams (the UI will render them)
- Tables for structured inventories (fields, parameters, mappings)
- Numbered lists for sequential flows, bullet points for properties
- Bold key terms and object names on first mention
- Professional tone suitable for stakeholder review and developer handover

Generate the documentation now.`;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as DocumentationRequest;
    const { inventory, xml, projectName, level } = body;
    
    const content = inventory || xml;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("Missing ANTHROPIC_API_KEY environment variable");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 503 }
      );
    }

    // Build the user message
    let userMessage: string;
    
    if (inventory) {
      // Structured inventory from client-side parser
      userMessage = `Generate ${level} documentation for this Appian application. The following is a pre-parsed structured inventory extracted from the export XML - object names, types, fields, relationships, expression logic, process flows, and cross-references are all included:\n\n${content}`;
    } else {
      // Raw XML fallback
      userMessage = `Generate ${level} documentation for the following Appian exported package XML:\n\n\`\`\`xml\n${content}\n\`\`\``;
    }

    if (projectName) {
      userMessage = `Project Name: ${projectName}\n\n${userMessage}`;
    }

    // Call Anthropic API with streaming
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16384,
        system: buildSystemPrompt(level),
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      
      return NextResponse.json(
        { error: "AI service error: " + response.status + " - " + errorText.slice(0, 200) },
        { status: 502 }
      );
    }

    // Stream response back using SSE format
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let doneSent = false;

        const sendDone = (stopReason?: string) => {
          if (doneSent) return;
          doneSent = true;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: "done",
              ...(stopReason === "max_tokens" ? { truncated: true } : {})
            })}\n\n`)
          );
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") {
                  sendDone();
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);

                  // Content deltas
                  if (
                    parsed.type === "content_block_delta" &&
                    parsed.delta?.type === "text_delta" &&
                    parsed.delta.text
                  ) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ 
                          type: "content", 
                          text: parsed.delta.text 
                        })}\n\n`
                      )
                    );
                  }

                  // Anthropic sends message_delta with stop_reason at the end
                  if (parsed.type === "message_delta" && parsed.delta?.stop_reason) {
                    sendDone(parsed.delta.stop_reason);
                  }

                  // message_stop is the final event
                  if (parsed.type === "message_stop") {
                    sendDone();
                  }
                } catch {
                  // Skip unparseable chunks
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream reading error:", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: "error", 
              message: "Stream interrupted" 
            })}\n\n`)
          );
        } finally {
          sendDone();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Documentation generation error:", error);
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}