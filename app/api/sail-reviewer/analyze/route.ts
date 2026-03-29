import { NextRequest } from "next/server";

export const maxDuration = 60;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface AnalyzeRequest {
  code: string;
  level: "quick" | "standard" | "deep";
}

function getSystemPrompt(level: "quick" | "standard" | "deep"): string {
  const basePrompt = `You are an expert Appian SAIL code reviewer with deep knowledge of Appian best practices, performance optimization, and common anti-patterns. You review SAIL expressions and provide comprehensive feedback.

REVIEW CATEGORIES:

**🔴 Critical Issues** (Security/Functionality/Breaking):
- SQL injection risks in queries
- Hardcoded credentials or sensitive data
- Missing null checks that cause errors
- Incorrect component parameter usage
- Breaking syntax errors
- Security vulnerabilities

**🟡 Warnings** (Performance/Maintainability):
- N+1 query patterns
- Nested forEach loops in interfaces
- Inline queries instead of pre-loaded data
- Large dataset handling without pagination
- Unnecessary re-evaluations
- Complex nested expressions
- Missing error handling with a!tryError()

**🟢 Suggestions** (Best Practices/Optimization):
- Using if() instead of showWhen for visibility
- Hardcoded values instead of constants
- Poor naming conventions
- Missing documentation
- Suboptimal component choices
- Code organization improvements
- CDT and record type reference patterns

**📊 SCORECARD** (Rate 1-10 for each):
- **Security**: Access controls, credential handling, injection risks
- **Performance**: Query efficiency, data handling, re-evaluation patterns
- **Maintainability**: Code organization, naming, documentation
- **Best Practices**: Proper component usage, error handling, patterns
- **Appian Standards**: Record types, CDTs, expression rules, process models

APPIAN-SPECIFIC KNOWLEDGE:

**Anti-patterns to flag:**
- Nested forEach loops in interfaces (use pre-computed data instead)
- Inline queries inside forEach or interface components
- Using if() instead of showWhen (destroys component state)
- Using index() instead of wherecontains() for array filtering  
- Synchronous integrations called from interfaces
- Missing a!localVariables() wrapper for stateful interfaces
- Hardcoded user/group references instead of constants
- Using a!gridField without proper data sources (should use a!recordData)

**Best practices to suggest:**
- Proper use of a!localVariables() for state management
- a!refreshVariable() for loading async data in interfaces
- Error handling with a!tryError() and a!isNotNullOrEmpty()
- Separation of concerns (business logic in expression rules, not interfaces)
- Record type references: recordType!MyRecord.fields.fieldName
- CDT constructors: 'type!MyCDT'()
- Constants for reusable values: cons!MY_CONSTANT
- Proper grid data sources with a!recordData() and filters
- Using showWhen instead of if() for conditional display
- Expression rule signatures with proper input types

**Performance patterns:**
- Pre-load data outside forEach loops
- Use a!queryRecordType with proper filters instead of loading all data
- Implement pagination with a!pagingInfo for large datasets
- Cache frequently accessed data with rule inputs
- Avoid repeated database calls in component loops
- Use batch operations instead of individual record saves

**Security checks:**
- Hardcoded credentials (flag immediately)
- SQL injection risks in dynamic query building
- Missing access controls on sensitive data
- Exposed internal system information
- Improper user context handling`;

  const levelInstructions = {
    quick: `
**REVIEW LEVEL: QUICK SCAN**
Focus ONLY on critical issues and major anti-patterns. Keep analysis brief and actionable.
- Flag security risks and breaking errors immediately
- Highlight the worst performance issues (nested loops, inline queries)
- Mention 1-2 biggest best practice violations
- Provide a simple scorecard
- Keep total response under 500 words`,

    standard: `
**REVIEW LEVEL: STANDARD REVIEW**
Provide comprehensive analysis covering all categories with practical suggestions.
- Cover all critical issues with explanations
- Identify performance bottlenecks and suggest fixes
- Review best practices and suggest improvements  
- Include detailed scorecard with reasoning
- Provide code examples for key improvements
- Target 800-1200 words`,

    deep: `
**REVIEW LEVEL: DEEP DIVE**
Exhaustive analysis with refactoring recommendations and rewritten code samples.
- Thorough security and functionality review
- Complete performance optimization recommendations
- Detailed refactoring suggestions with before/after examples
- Comprehensive best practices review
- Full scorecard with detailed explanations
- Multiple code improvement examples
- Architectural suggestions for complex patterns
- Target 1200+ words with extensive examples`
  };

  return basePrompt + levelInstructions[level] + `

OUTPUT FORMAT:

# 📊 SAIL Code Review Summary

**Overall Assessment**: [Brief 1-2 sentence summary]

## 🔴 Critical Issues
[List any security, functionality, or breaking issues. If none, say "None identified."]

## 🟡 Warnings  
[List performance and maintainability concerns. If none, say "None identified."]

## 🟢 Suggestions
[List best practice improvements and optimizations. If none, say "Code follows good practices."]

## 📊 Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| **Security** | X/10 | [Brief explanation] |
| **Performance** | X/10 | [Brief explanation] |
| **Maintainability** | X/10 | [Brief explanation] |
| **Best Practices** | X/10 | [Brief explanation] |
| **Appian Standards** | X/10 | [Brief explanation] |

**Overall Score: XX/50**

${level === "deep" ? `
## 🔧 Refactoring Recommendations

[Provide specific code examples and refactored versions]

## 🏗️ Architecture Suggestions

[Higher-level design recommendations]
` : ""}

Remember: Be specific, actionable, and reference actual Appian functionality. Always provide reasoning for your assessments.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeRequest;
    const { code, level } = body;

    if (!code?.trim()) {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!["quick", "standard", "deep"].includes(level)) {
      return new Response(
        JSON.stringify({ error: "Invalid review level" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
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
        max_tokens: level === "deep" ? 4000 : level === "standard" ? 3000 : 2000,
        system: getSystemPrompt(level),
        messages: [
          {
            role: "user",
            content: `Please review this SAIL code:\n\n\`\`\`sail\n${code}\n\`\`\``
          }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stream response using the same pattern as builder/generate
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
                    const chunk = parsed.delta.text;
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: "content", text: chunk })}\n\n`
                      )
                    );
                  }
                } catch (e) {
                  // Skip unparseable lines
                  console.warn("Failed to parse SSE line:", line);
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream processing error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "content", text: "❌ **Error**: Analysis failed unexpectedly. Please try again." })}\n\n`
            )
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
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("SAIL reviewer API error:", error);
    return new Response(
      JSON.stringify({ error: "Analysis failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}