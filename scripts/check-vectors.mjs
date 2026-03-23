import { neon } from "@neondatabase/serverless";

const sql = neon("postgresql://neondb_owner:npg_HRLp6F7oICcn@ep-rough-glade-ailx0054-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require");
const COLLECTION_ID = "7b86ae30-54ea-40bb-a7ca-df5340b9e683";

const rows = await sql`SELECT content FROM vl_documents WHERE collection_id = ${COLLECTION_ID} LIMIT 3`;
rows.forEach((r, i) => console.log(`--- Doc ${i} ---\n${r.content}\n`));

const count = await sql`SELECT count(*) as cnt FROM vl_documents WHERE collection_id = ${COLLECTION_ID}`;
console.log(`Total docs in collection: ${count[0].cnt}`);
