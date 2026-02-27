import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const COLLECTION_ID = "cb1653f2-6b08-42a0-b717-2bdb4151d7b0";

export const maxDuration = 30;

async function getEmbeddingFromHF(text: string): Promise<number[]> {
  const res = await fetch(
    "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return Array.isArray(data[0]) ? data[0] : data;
}

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 12 } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query string required" }, { status: 400 });
    }

    const embedding = await getEmbeddingFromHF(query);
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
