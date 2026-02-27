import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const COLLECTION_ID = "cb1653f2-6b08-42a0-b717-2bdb4151d7b0";

export async function POST(req: NextRequest) {
  try {
    const { embedding, limit = 10 } = await req.json();

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json({ error: "embedding array required" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const embStr = `[${embedding.join(",")}]`;

    const results = await sql`
      SELECT content, 1 - (embedding <=> ${embStr}::vector) as similarity
      FROM vl_documents
      WHERE collection_id = ${COLLECTION_ID}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${embStr}::vector
      LIMIT ${limit}
    `;

    // Parse function data from content
    const parsed = results.map((r: Record<string, unknown>) => {
      const lines = (r.content as string).split("\n");
      const nameMatch = lines[0]?.match(/^(.+?)\s*\((.+)\)$/);
      return {
        name: nameMatch ? nameMatch[1].trim() : lines[0],
        category: nameMatch ? nameMatch[2].trim() : "",
        content: r.content,
        similarity: Number(r.similarity),
      };
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
