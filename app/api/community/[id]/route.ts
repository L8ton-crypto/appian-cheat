import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureCommunityDb } from "@/lib/community-db";

export const dynamic = "force-dynamic";

// GET /api/community/[id] - Get thread with replies
export async function GET(
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

    const threads = await sql`SELECT * FROM ac_threads WHERE id = ${threadId}`;
    if (threads.length === 0) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const replies = await sql`
      SELECT * FROM ac_replies
      WHERE thread_id = ${threadId}
      ORDER BY is_accepted DESC, upvotes DESC, created_at ASC
    `;

    return NextResponse.json({
      thread: threads[0],
      replies,
    });
  } catch (error) {
    console.error("Thread GET error:", error);
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }
}
