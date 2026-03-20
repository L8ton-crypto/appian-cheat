import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureCommunityDb } from "@/lib/community-db";

export const dynamic = "force-dynamic";

// POST /api/community/[id]/reply - Add reply to thread
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCommunityDb();
    const sql = getDb();
    const { id } = await params;
    const threadId = parseInt(id);

    if (isNaN(threadId)) {
      return NextResponse.json({ error: "Invalid thread ID" }, { status: 400 });
    }

    // Check thread exists
    const threads = await sql`SELECT id FROM ac_threads WHERE id = ${threadId}`;
    if (threads.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const body = await req.json();
    const { content, authorName } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Reply content is required" }, { status: 400 });
    }

    if (content.trim().length > 5000) {
      return NextResponse.json({ error: "Reply must be 5,000 characters or less" }, { status: 400 });
    }

    const name = (authorName?.trim() || "Anonymous").slice(0, 50);

    const result = await sql`
      INSERT INTO ac_replies (thread_id, body, author_name)
      VALUES (${threadId}, ${content.trim()}, ${name})
      RETURNING *
    `;

    // Update reply count
    await sql`
      UPDATE ac_threads
      SET reply_count = (SELECT COUNT(*) FROM ac_replies WHERE thread_id = ${threadId}),
          updated_at = NOW()
      WHERE id = ${threadId}
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Reply POST error:", error);
    return NextResponse.json({ error: "Failed to add reply" }, { status: 500 });
  }
}
