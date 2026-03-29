import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface DocumentationRequest {
  xml: string;
  projectName?: string;
  level: "summary" | "standard" | "comprehensive";
}

const buildSystemPrompt = (level: "summary" | "standard" | "comprehensive") => {
  const basePrompt = `You are an expert Appian solution architect specializing in documentation generation. Your task is to analyze Appian exported package XML and generate comprehensive solution documentation.

ANALYSIS REQUIREMENTS:
Parse the Appian exported package XML to identify and document:
- Process models (BPM flows, gateways, activities, exception handling)
- Expression rules and functions (business logic, calculations, utilities)
- Interfaces (SAIL code, forms, reports, dashboards)
- CDTs (Custom Data Types) and data structures
- Record types (entities, fields, relationships, security)
- Constants (application configuration, environment settings)
- Groups and security model (roles, permissions)
- Sites and portals (navigation, landing pages)
- Connected systems (integrations, web services, databases)
- Integrations (API calls, web service calls, database queries)
- Decisions (business rules, rule sets)
- Web APIs (REST endpoints, operations)

DOCUMENTATION STRUCTURE:
Generate a markdown document with these sections:

## Solution Overview
- Application purpose and business domain
- Key entities and business processes
- Target users and use cases
- High-level capabilities and features

## Architecture
- System design principles and patterns
- Layer architecture (presentation, process, data, integration)
- Key design decisions and rationale
- Technology stack and dependencies

## Data Model
- CDTs and record types with field descriptions
- Entity relationships and dependencies
- Data flow between components
- Text-based entity relationship diagrams

## Process Model Inventory
For each process model:
- Process name, description, and purpose
- Flow description (start → activities → end)
- Input and output parameters
- Integration points and external systems
- Gateway logic and branching
- Exception handling and error paths
- Performance considerations

## Interface Inventory
For key interfaces:
- Interface name, type, and purpose
- Linked expression rules and data sources
- User interaction patterns
- Security and permissions

## Expression Rules & Functions
Grouped by functional area:
- Business logic rules
- Utility and helper functions
- Data transformation rules
- Validation and calculation rules
- Dependency chains and relationships

## Integration Map
- Connected systems and external endpoints
- Web APIs and service calls
- Data exchange patterns and formats
- Authentication and security methods
- Error handling and retry logic

## Security Model
- Groups and role definitions
- Record-level security configuration
- Process and interface permissions
- Data visibility and access controls

## Dependency Graph
Text-based visualization of component dependencies:
- Which objects reference which
- Critical path components
- Potential impact analysis for changes

## Deployment Notes
- Constants requiring environment configuration
- External system dependencies
- Database setup requirements
- Security configuration steps
- Testing and validation checklist`;

  const levelInstructions = {
    summary: `
DOCUMENTATION LEVEL: SUMMARY
- Focus on high-level overview only (target 1-2 pages)
- Include only Solution Overview, Architecture, and high-level Data Model
- Brief bullet points rather than detailed explanations
- Skip detailed technical specifications
- Emphasize business value and key capabilities`,

    standard: `
DOCUMENTATION LEVEL: STANDARD
- Include all sections with moderate detail
- Balance technical depth with readability
- Provide enough detail for developers to understand implementation
- Include key code patterns and examples where relevant
- Target 5-10 pages of documentation`,

    comprehensive: `
DOCUMENTATION LEVEL: COMPREHENSIVE
- Exhaustive documentation with maximum detail
- Include code snippets and technical specifications
- Detailed implementation notes and best practices
- Maintenance recommendations and troubleshooting guides
- Performance optimization suggestions
- Complete developer reference (10+ pages)`
  };

  return basePrompt + "\n\n" + levelInstructions[level] + `

OUTPUT FORMAT:
- Use clean markdown formatting
- Include clear section headers with ##
- Use bullet points and numbered lists for clarity
- Add code blocks for technical specifications
- Use tables for structured data when appropriate
- Ensure the documentation is professional and ready for stakeholder review

Begin analysis and generate the documentation now.`;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as DocumentationRequest;
    const { xml, projectName, level } = body;

    if (!xml?.trim()) {
      return NextResponse.json(
        { error: "XML content is required" },
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
    let userMessage = `Please generate ${level} documentation for the following Appian exported package XML:

\`\`\`xml
${xml}
\`\`\``;

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
        max_tokens: 8192,
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
        { error: "AI service temporarily unavailable" },
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
                if (data === "[DONE]") {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
                  );
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
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
                } catch (parseError) {
                  // Skip unparseable chunks
                  console.warn("Failed to parse SSE data:", data);
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
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
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