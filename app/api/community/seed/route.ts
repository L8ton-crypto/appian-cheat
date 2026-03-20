import { NextResponse } from "next/server";
import { getDb, ensureCommunityDb } from "@/lib/community-db";

export const dynamic = "force-dynamic";

// POST /api/community/seed - Seed example threads (run once)
export async function POST() {
  try {
    await ensureCommunityDb();
    const sql = getDb();

    // Check if already seeded
    const existing = await sql`SELECT COUNT(*)::int as count FROM ac_threads`;
    if (existing[0].count > 0) {
      return NextResponse.json({ message: "Already seeded", count: existing[0].count });
    }

    const seeds = [
      {
        title: "Best practice for complex record type relationships?",
        body: "I have a record type with 5+ related record types through various relationship types (one-to-one, one-to-many). Performance is starting to suffer when querying with all relationships included.\n\nWhat's the best practice here? Should I:\n1. Use queryRecordType with specific fetchFields to limit what's loaded?\n2. Break it into multiple smaller queries?\n3. Use a!queryEntity instead for complex joins?\n\nRunning Appian 25.4 with a PostgreSQL data source.",
        category: "Records",
        author_name: "AppianDev42"
      },
      {
        title: "How to properly handle errors in integration objects?",
        body: "I'm building an integration with a third-party REST API that sometimes returns 500 errors. Right now my process model just fails when this happens.\n\nWhat's the recommended pattern for:\n- Retrying failed integrations (with exponential backoff)\n- Logging integration failures for debugging\n- Showing user-friendly error messages in the UI\n\nI've seen some people use a!httpResponse() in connected systems but I'm not sure that's the right approach.",
        category: "Integrations",
        author_name: "ProcessBuilder"
      },
      {
        title: "SAIL: Dynamic column grid based on user data",
        body: "I need to build a grid that shows different columns based on the user's role. Admins see all columns, managers see a subset, and regular users see a minimal view.\n\nI'm currently using a!gridField with a!forEach to dynamically build columns but it's getting messy. Is there a cleaner pattern?\n\nHere's my current approach:\n```\na!gridField(\n  columns: a!forEach(\n    items: local!visibleColumns,\n    expression: a!gridColumn(...)\n  )\n)\n```\n\nAny better alternatives?",
        category: "SAIL",
        author_name: "UIWizard"
      },
      {
        title: "CDT vs Record Type - when to use which?",
        body: "I'm migrating an older Appian application (built in 21.x) to 25.4. The old app uses CDTs everywhere - as process variables, rule inputs, and for database storage.\n\nAppian now recommends record types for everything. Should I:\n1. Convert ALL CDTs to record types?\n2. Keep CDTs for simple data transfer and use record types for DB-backed entities?\n3. Some hybrid approach?\n\nWhat's been your experience with large-scale CDT-to-record migrations?",
        category: "CDTs",
        author_name: "MigrationExpert"
      },
      {
        title: "Performance tips for large process models?",
        body: "We have a process model with ~50 nodes (mix of script tasks, user tasks, sub-processes, and integrations). It's taking 30+ seconds to start.\n\nThings I've tried:\n- Moving heavy logic to expression rules\n- Using async sub-processes for non-blocking work\n- Reducing process variables\n\nWhat else can I do? Are there any common gotchas with large process models in 25.4?",
        category: "Performance",
        author_name: "OptimizeEverything"
      },
      {
        title: "Expression rule: Recursive hierarchy flattening",
        body: "I need to flatten a hierarchical data structure (org chart) into a flat list. Each node has a parentId and I need all descendants of a given node.\n\nAppian doesn't support true recursion in expression rules. What's the best workaround?\n\nI've tried:\n- Looping with reduce() but can't go more than N levels deep\n- Multiple chained queries (inefficient)\n- Storing pre-computed paths in the DB\n\nAnyone solved this elegantly?",
        category: "Expression Rules",
        author_name: "TreeWalker"
      },
      {
        title: "Portal authentication patterns - what works best?",
        body: "Building my first Appian Portal for external users. Need to figure out authentication.\n\nOptions I'm considering:\n1. Appian's built-in portal auth (service account)\n2. Custom login form with API-based auth\n3. SSO via SAML/OAuth\n\nThe portal needs to show user-specific data so anonymous access won't work. What authentication pattern have you found most reliable for production portals?",
        category: "Portals",
        author_name: "PortalPioneer"
      },
      {
        title: "Design pattern: Smart process model error boundaries",
        body: "I want to share a pattern I've been using for error handling across all our process models. Instead of adding try/catch to every node, I wrap groups of nodes in sub-processes with a standard error boundary.\n\nThe pattern:\n1. Create a 'SafeExecute' sub-process template\n2. It wraps any logic in an escalation-based error handler\n3. On error: logs to a central error table, sends alert, and gracefully degrades\n4. Parent process gets a clean success/failure result\n\nHas anyone implemented something similar? Would love to compare approaches.",
        category: "Design Patterns",
        author_name: "ArchitectAppian"
      },
    ];

    for (const seed of seeds) {
      await sql`
        INSERT INTO ac_threads (title, body, category, author_name)
        VALUES (${seed.title}, ${seed.body}, ${seed.category}, ${seed.author_name})
      `;
    }

    return NextResponse.json({ message: "Seeded successfully", count: seeds.length });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}
