import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const DB_URL = "postgresql://neondb_owner:npg_HRLp6F7oICcn@ep-rough-glade-ailx0054-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
const COLLECTION_ID = "7b86ae30-54ea-40bb-a7ca-df5340b9e683";
const HF_URL = "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5";
const HF_TOKEN = process.env.HF_TOKEN; // Set via: $env:HF_TOKEN="hf_..."

const sql = neon(DB_URL);

// Get existing content from DB to find what's already embedded
const existing = await sql`SELECT content FROM vl_documents WHERE collection_id = ${COLLECTION_ID}`;
const existingNames = new Set(existing.map(r => {
  const match = r.content.match(/\[Function\]\s+(\S+)/);
  return match ? match[1] : null;
}).filter(Boolean));

console.log(`Existing embedded functions: ${existingNames.size}`);

// Read data.ts and extract all functions
const dataTs = readFileSync("lib/data.ts", "utf-8");
const fnRegex = /name:\s*"([^"]+)"[\s\S]*?syntax:\s*"([^"]+)"[\s\S]*?description:\s*"([^"]+)"[\s\S]*?example:\s*'([^']*)'[\s\S]*?category:\s*"([^"]+)"/g;

const allFunctions = [];
let match;
while ((match = fnRegex.exec(dataTs)) !== null) {
  const [, name, syntax, description, example, category] = match;
  allFunctions.push({ name, syntax, description, example, category });
}

console.log(`Total functions in data.ts: ${allFunctions.length}`);

// Find functions not yet in the vector store
const newFunctions = allFunctions.filter(fn => !existingNames.has(fn.name));
console.log(`New functions to embed: ${newFunctions.length}`);

if (newFunctions.length === 0) {
  console.log("Nothing to do!");
  process.exit(0);
}

// Format content the same way as existing docs
function formatContent(fn) {
  let content = `[Function] ${fn.name} (${fn.category})\nSyntax: ${fn.syntax}\nDescription: ${fn.description}`;
  if (fn.example) content += `\nExample: ${fn.example}`;
  return content;
}

// Generate embedding via HuggingFace
async function getEmbedding(text) {
  const res = await fetch(HF_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${HF_TOKEN}` },
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HF API error: ${res.status} ${err}`);
  }
  const data = await res.json();
  return Array.isArray(data[0]) ? data[0] : data;
}

// Get max chunk_index
const maxIdx = await sql`SELECT COALESCE(MAX(chunk_index), -1) as max_idx FROM vl_documents WHERE collection_id = ${COLLECTION_ID}`;
let chunkIndex = maxIdx[0].max_idx + 1;

// Process in batches to respect rate limits
const BATCH_SIZE = 5;
let added = 0;

for (let i = 0; i < newFunctions.length; i += BATCH_SIZE) {
  const batch = newFunctions.slice(i, i + BATCH_SIZE);
  
  for (const fn of batch) {
    const content = formatContent(fn);
    try {
      const embedding = await getEmbedding(content);
      const embeddingStr = `[${embedding.join(",")}]`;
      
      await sql`
        INSERT INTO vl_documents (collection_id, content, chunk_index, embedding)
        VALUES (${COLLECTION_ID}, ${content}, ${chunkIndex}, ${embeddingStr}::vector)
      `;
      
      added++;
      chunkIndex++;
      console.log(`  ✓ ${fn.name} (${added}/${newFunctions.length})`);
    } catch (err) {
      console.error(`  ✗ ${fn.name}: ${err.message}`);
    }
  }
  
  // Rate limit: 1 req/sec for free tier, small delay between batches
  if (i + BATCH_SIZE < newFunctions.length) {
    await new Promise(r => setTimeout(r, 2000));
  }
}

console.log(`\nDone! Added ${added} new embeddings. Total should now be ${existingNames.size + added}`);
