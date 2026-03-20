import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureCommunityDb, COMMUNITY_CATEGORIES } from "@/lib/community-db";

export const dynamic = "force-dynamic";

// GET /api/community - List threads
export async function GET(req: NextRequest) {
  try {
    await ensureCommunityDb();
    const sql = getDb();
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category") || "all";
    const sort = searchParams.get("sort") || "latest"; // latest | popular | unanswered
    const search = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const offset = (page - 1) * limit;

    let threads;
    let total;

    if (category !== "all" && search) {
      const searchPattern = `%${search}%`;
      threads = await sql`
        SELECT * FROM ac_threads
        WHERE category = ${category}
          AND (title ILIKE ${searchPattern} OR body ILIKE ${searchPattern})
        ORDER BY is_pinned DESC,
          ${sort === "popular" ? sql`upvotes DESC` : sort === "unanswered" ? sql`reply_count ASC` : sql`created_at DESC`}
        LIMIT ${limit} OFFSET ${offset}
      `;
      total = await sql`
        SELECT COUNT(*)::int as count FROM ac_threads
        WHERE category = ${category}
          AND (title ILIKE ${searchPattern} OR body ILIKE ${searchPattern})
      `;
    } else if (category !== "all") {
      threads = await sql`
        SELECT * FROM ac_threads
        WHERE category = ${category}
        ORDER BY is_pinned DESC,
          ${sort === "popular" ? sql`upvotes DESC` : sort === "unanswered" ? sql`reply_count ASC` : sql`created_at DESC`}
        LIMIT ${limit} OFFSET ${offset}
      `;
      total = await sql`SELECT COUNT(*)::int as count FROM ac_threads WHERE category = ${category}`;
    } else if (search) {
      const searchPattern = `%${search}%`;
      threads = await sql`
        SELECT * FROM ac_threads
        WHERE title ILIKE ${searchPattern} OR body ILIKE ${searchPattern}
        ORDER BY is_pinned DESC,
          ${sort === "popular" ? sql`upvotes DESC` : sort === "unanswered" ? sql`reply_count ASC` : sql`created_at DESC`}
        LIMIT ${limit} OFFSET ${offset}
      `;
      total = await sql`
        SELECT COUNT(*)::int as count FROM ac_threads
        WHERE title ILIKE ${searchPattern} OR body ILIKE ${searchPattern}
      `;
    } else {
      threads = await sql`
        SELECT * FROM ac_threads
        ORDER BY is_pinned DESC,
          ${sort === "popular" ? sql`upvotes DESC` : sort === "unanswered" ? sql`reply_count ASC` : sql`created_at DESC`}
        LIMIT ${limit} OFFSET ${offset}
      `;
      total = await sql`SELECT COUNT(*)::int as count FROM ac_threads`;
    }

    // Category counts for sidebar
    const categoryCounts = await sql`
      SELECT category, COUNT(*)::int as count
      FROM ac_threads
      GROUP BY category
      ORDER BY count DESC
    `;

    const totalCount = total[0]?.count || 0;

    return NextResponse.json({
      threads,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      categoryCounts: categoryCounts.reduce((acc: Record<string, number>, row: any) => {
        acc[row.category] = row.count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error("Community GET error:", error);
    return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 });
  }
}

// POST /api/community - Create thread
export async function POST(req: NextRequest) {
  try {
    await ensureCommunityDb();
    const sql = getDb();
    const body = await req.json();

    const { title, content, category, authorName } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    if (title.trim().length > 200) {
      return NextResponse.json({ error: "Title must be 200 characters or less" }, { status: 400 });
    }

    if (content.trim().length > 10000) {
      return NextResponse.json({ error: "Content must be 10,000 characters or less" }, { status: 400 });
    }

    const validCategory = COMMUNITY_CATEGORIES.includes(category) ? category : "General";
    const name = (authorName?.trim() || "Anonymous").slice(0, 50);

    const result = await sql`
      INSERT INTO ac_threads (title, body, category, author_name)
      VALUES (${title.trim()}, ${content.trim()}, ${validCategory}, ${name})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Community POST error:", error);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
