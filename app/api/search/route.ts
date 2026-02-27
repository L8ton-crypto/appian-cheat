import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const COLLECTION_ID = "cb1653f2-6b08-42a0-b717-2bdb4151d7b0";

// Cache pipeline in module scope
let pipelineInstance: unknown = null;
let pipelinePromise: Promise<unknown> | null = null;

async function getPipeline() {
  if (pipelineInstance) return pipelineInstance;
  if (pipelinePromise) return pipelinePromise;

  pipelinePromise = (async () => {
    const { pipeline } = await import("@xenova/transformers");
    pipelineInstance = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      quantized: true,
    });
    return pipelineInstance;
  })();

  return pipelinePromise;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const pipe = (await getPipeline()) as (
    text: string,
    opts: Record<string, unknown>
  ) => Promise<{ data: Float32Array }>;
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { query, limit = 12 } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query string required" }, { status: 400 });
    }

    const embedding = await generateEmbedding(query);
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
