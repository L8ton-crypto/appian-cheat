import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureCommunityDb } from "@/lib/community-db";

export const dynamic = "force-dynamic";

// POST /api/community/vote - Upvote a thread or reply
export async function POST(req: NextRequest) {
  try {
    await ensureCommunityDb();
    const sql = getDb();
    const body = await req.json();

    const { targetType, targetId, voterHash } = body;

    if (!targetType || !targetId || !voterHash) {
      return NextResponse.json({ error: "targetType, targetId, and voterHash are required" }, { status: 400 });
    }

    if (targetType !== "thread" && targetType !== "reply") {
      return NextResponse.json({ error: "targetType must be 'thread' or 'reply'" }, { status: 400 });
    }

    // Check if already voted
    const existing = await sql`
      SELECT id FROM ac_votes
      WHERE target_type = ${targetType} AND target_id = ${targetId} AND voter_hash = ${voterHash}
    `;

    if (existing.length > 0) {
      // Remove vote (toggle off)
      await sql`
        DELETE FROM ac_votes
        WHERE target_type = ${targetType} AND target_id = ${targetId} AND voter_hash = ${voterHash}
      `;

      // Decrement
      if (targetType === "thread") {
        await sql`UPDATE ac_threads SET upvotes = GREATEST(0, upvotes - 1) WHERE id = ${targetId}`;
      } else {
        await sql`UPDATE ac_replies SET upvotes = GREATEST(0, upvotes - 1) WHERE id = ${targetId}`;
      }

      return NextResponse.json({ voted: false });
    }

    // Add vote
    await sql`
      INSERT INTO ac_votes (target_type, target_id, voter_hash)
      VALUES (${targetType}, ${targetId}, ${voterHash})
    `;

    // Increment
    if (targetType === "thread") {
      await sql`UPDATE ac_threads SET upvotes = upvotes + 1 WHERE id = ${targetId}`;
    } else {
      await sql`UPDATE ac_replies SET upvotes = upvotes + 1 WHERE id = ${targetId}`;
    }

    return NextResponse.json({ voted: true });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
