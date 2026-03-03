import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const COLLECTION_ID = "7b86ae30-54ea-40bb-a7ca-df5340b9e683";
const HF_URL =
  "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";

export const maxDuration = 30;

async function getQueryEmbedding(text: string): Promise<number[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.HF_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
  }

  const res = await fetch(HF_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
  });

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

    const sql = neon(process.env.DATABASE_URL!);

    // Generate embedding from the query text via HF API
    const embedding = await getQueryEmbedding(query);
    const embeddingStr = `[${embedding.join(",")}]`;

    // Vector similarity search using cosine distance
    const results = await sql`
      SELECT content, 1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM vl_documents
      WHERE collection_id = ${COLLECTION_ID}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingStr}::vector
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
