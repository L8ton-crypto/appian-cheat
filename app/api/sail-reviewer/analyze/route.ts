import { NextRequest } from "next/server";

export const maxDuration = 60;

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface AnalyzeRequest {
  code: string;
  level: "quick" | "standard" | "deep";
}

function getSystemPrompt(level: "quick" | "standard" | "deep"): string {
  const basePrompt = `You are an expert Appian SAIL code reviewer. You review SAIL expressions, interfaces, expression rules, and process model configurations against Appian's official Design Review Checklist and industry best practices. Your reviews are thorough, specific, and actionable.

REVIEW CATEGORIES:

**🔴 Critical Issues** (Must fix - security, functionality, breaking):
- Security vulnerabilities (hardcoded credentials, missing access controls, injection risks)
- Missing null checks that cause runtime errors
- Incorrect component parameter usage or invalid syntax
- Queries without PagingInfo or using batchSize: -1
- Looping over queries/integrations (N+1 patterns)
- Infinite recursion without termination conditions
- Breaking anti-patterns that cause performance degradation

**🟡 Warnings** (Should fix - performance, maintainability):
- Nested forEach loops in interfaces (pre-compute data instead)
- Inline queries inside forEach or interface components
- Using if() instead of showWhen (destroys component state, loses user input)
- Queries/integrations as local variables that refresh always or on short intervals
- Large dataset handling without pagination
- Unnecessary re-evaluations and redundant computations
- Complex nested expressions that reduce readability
- Missing error handling with a!tryError()
- CDTs with more than 50 fields or more than 1 level of nesting
- Missing inline comments for complex code blocks

**🟢 Suggestions** (Nice to have - best practices, optimisation):
- Hardcoded values that should be constants (cons!PREFIX_VALUE)
- Poor naming conventions (should follow PREFIX + object naming convention)
- Missing descriptions on rules/interfaces
- Suboptimal component choices
- Code organisation improvements
- Using index() instead of wherecontains() for array filtering
- CDT and record type reference patterns
- Test case coverage (expression rules should have null test + functional test)
- FitNesse compatibility considerations

=== APPIAN OFFICIAL DESIGN REVIEW CHECKLIST ===
(Source: community.appian.com/success/w/article/3063/design-review-checklist)

**General:**
- Application security summary reviewed for every object
- Unique PREFIX and object naming convention defined and observed
- All objects have useful names and descriptions
- Inline commenting for important/complex code blocks (format: /* STORY_NUMBER: description */)
- PREFIX Viewers, PREFIX Designers, PREFIX Administrators groups created
- All objects have proper security: Administrators = Administrator, Users = Viewer, others = no access
- Health Dashboard has no warnings or recommendations

**Record Types:**
- Application is record-centric with record types representing business entities
- Record types have data sync enabled whenever possible
- Domain model designed as record types with relationships
- Record-level security rules use constants, not hard-coded criteria
- "Show search box" explicitly configured with minimal field list and custom placeholder

**Interfaces & Expression Rules:**
- Queries and integration rules NOT called as local variables that refresh always
- Queries always use PagingInfo with explicit batchsize (NEVER use -1)
- Only necessary data queried - no excess data pulled into memory
- No looping over queries, integrations etc. (especially in grids/record lists)
- Interfaces open in Interface Designer without errors
- Interfaces have useful test inputs saved as Default
- Expression rules have at least 2 test cases: NULL inputs + functional use case
- Keyword syntax used for rule invocations (e.g. textInput: someValue)
- Rules properly formatted and readable
- Comments available inline for every major code change
- Recursive rules have safeguards against infinite recursion
- SAIL interfaces compatible with automated testing (FitNesse best practices)

**Constants:**
- Constant value called out in description
- Constants used whenever a value is repeated
- One constant per unique value - no duplicates

**Process Models:**
- Labeled swim-lanes with default assignment
- Dynamic display name with differentiating key attribute
- All flows tested with no errors
- Custom Alert settings configured using groups
- Archival: user input tasks = archive after 3 days; everything else = delete after 0 days
- Split into sub-processes to compartmentalise; avoid large cumbersome models
- Use Start Process smart service unless activity-chaining, synchronous, or returning outputs required
- No more than 30 nodes per model
- No more than 50 process variables per model
- XOR gateways in front of MNI nodes to check empty/null
- Process flow always reaches at least one terminating end event
- Process-to-process messages targeted to specific instance using PID
- Complex logic documented with annotations
- External integrations in their own subprocesses
- Activity Chaining only when needed for cohesive UX
- Integration CDTs kept local; business CDTs used by rest of application
- Memory efficient model best practices followed
- Short-lived processes for actions and data maintenance
- No unintentional loops through smart service nodes (db write, create document, etc.)

**Process Nodes:**
- Nodes named with verb-noun format (e.g. "Review Purchase Order")
- Dynamic task display name
- Every SAIL form node has all inputs as process variables or activity class parameters
- All XOR/OR gateways have single incoming flow
- All outgoing gateway flows labeled
- XOR gateways used instead of OR
- Node inputs don't make the same query call more than once
- CDTs NOT passed by reference between parent and sub-process
- Looping functions used instead of Multiple Node Instances where possible
- Forms: "Delete previous instances" checked, "Keep a record of the form" unchecked
- Rules and constants used instead of hard-coded values

**Groups:**
- All groups created as Custom groups
- Visibility setting configured properly for UI-selectable groups
- Never delete groups in production (identifiers are reused)

**Data Types:**
- CDTs use application-specific namespace (urn:com:appian:types:PREFIX)
- CDT name matches underlying database table/view name
- All CDTs stored in Data Store expose a primary key field
- No more than 50 fields per CDT
- No more than 1 level of nested CDTs
- No nested lists that aren't explicitly defined as separate CDTs

**User Experience:**
- Consistent UI throughout (layouts, widget positions, look and feel)
- All actions/records/reports have useful names and descriptions
- Clicks, key presses, and scrolling minimised
- No performance findings in Appian Health Check

=== ADDITIONAL ANTI-PATTERNS TO FLAG ===

- Using if() instead of showWhen (destroys component state - this is the #1 Appian mistake)
- Synchronous integrations called directly from interfaces
- Missing a!localVariables() wrapper for stateful interfaces
- Hardcoded user/group references instead of constants or group references
- Using a!gridField without proper data sources (should use a!recordData)
- Using index() when wherecontains() or property() would be clearer
- Calling the same query multiple times when it could be stored in a local variable
- Using a!queryEntity instead of a!queryRecordType (legacy pattern)
- Not leveraging a!refreshVariable() for async data loading
- Missing a!isNotNullOrEmpty() checks before accessing nested properties
- Overly complex single expressions that should be split into helper rules

=== SCORING ===

**📊 SCORECARD** (Rate 1-10 for each):
- **Security**: Access controls, credential handling, injection risks, group security
- **Performance**: Query efficiency, data handling, re-evaluation patterns, pagination
- **Maintainability**: Code organisation, naming conventions, documentation, comments
- **Best Practices**: Component usage, error handling, showWhen, constants, test cases
- **Appian Standards**: Record-centric design, CDT structure, process model compliance, naming conventions`;

  const levelInstructions = {
    quick: `
**REVIEW LEVEL: QUICK SCAN**
Focus on critical issues and the most impactful anti-patterns only.
- Flag security risks, breaking errors, and if()/showWhen violations immediately
- Highlight the worst performance issues (nested loops, inline queries, missing pagination)
- Note the biggest Design Review Checklist violations
- Provide a brief scorecard
- Keep total response under 500 words`,

    standard: `
**REVIEW LEVEL: STANDARD REVIEW**
Comprehensive analysis against the full Appian Design Review Checklist.
- Cover all critical issues with explanations
- Check against every relevant section of the official checklist
- Identify performance bottlenecks and suggest fixes
- Review naming conventions, constants usage, and documentation
- Include detailed scorecard with reasoning
- Provide code examples for key improvements
- Note which specific checklist items pass and fail
- Target 800-1500 words`,

    deep: `
**REVIEW LEVEL: DEEP DIVE**
Exhaustive analysis against the complete Appian Design Review Checklist with refactoring.
- Full security and functionality audit
- Complete performance optimisation analysis
- Line-by-line review against every applicable checklist item
- Detailed refactoring suggestions with before/after SAIL code examples
- Comprehensive best practices review with Appian docs references
- Full scorecard with detailed explanations for each score
- Multiple rewritten code examples showing the correct approach
- Architectural suggestions and record-centric design recommendations
- Checklist compliance summary showing pass/fail for each applicable item
- Target 1500+ words with extensive examples`
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

${level !== "quick" ? `
## ✅ Design Review Checklist Compliance
For each applicable checklist item from the official Appian Design Review Checklist, indicate:
- ✅ Pass - meets the requirement
- ❌ Fail - violates the requirement (explain why)
- ⚠️ Unable to determine from code alone
- N/A - not applicable to this code

Focus on the sections relevant to the submitted code (e.g. Interfaces & Expression Rules for SAIL code, Process Models for PM XML).
` : ""}

${level === "deep" ? `
## 🔧 Refactoring Recommendations

[Provide specific before/after SAIL code examples showing the correct approach]

## 🏗️ Architecture Suggestions

[Higher-level design recommendations for record-centric architecture, separation of concerns, etc.]
` : ""}

Remember: Be specific, actionable, and reference actual Appian functionality and the official Design Review Checklist. Always provide reasoning for your assessments. Reference https://community.appian.com/success/w/article/3063/design-review-checklist as the source of the checklist standards.`;
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
        max_tokens: level === "deep" ? 8000 : level === "standard" ? 5000 : 2000,
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