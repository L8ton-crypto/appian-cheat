import { neon } from "@neondatabase/serverless";

let initialized = false;

export function getDb() {
  return neon(process.env.DATABASE_URL!);
}

export async function ensureCommunityDb() {
  if (initialized) return;
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS ac_threads (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      body TEXT NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'General',
      author_name VARCHAR(50) NOT NULL DEFAULT 'Anonymous',
      upvotes INTEGER NOT NULL DEFAULT 0,
      reply_count INTEGER NOT NULL DEFAULT 0,
      is_pinned BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ac_replies (
      id SERIAL PRIMARY KEY,
      thread_id INTEGER NOT NULL REFERENCES ac_threads(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      author_name VARCHAR(50) NOT NULL DEFAULT 'Anonymous',
      upvotes INTEGER NOT NULL DEFAULT 0,
      is_accepted BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ac_votes (
      id SERIAL PRIMARY KEY,
      target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('thread', 'reply')),
      target_id INTEGER NOT NULL,
      voter_hash VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(target_type, target_id, voter_hash)
    )
  `;

  // Indexes for performance
  await sql`CREATE INDEX IF NOT EXISTS idx_ac_threads_category ON ac_threads(category)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ac_threads_created ON ac_threads(created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ac_threads_upvotes ON ac_threads(upvotes DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ac_replies_thread ON ac_replies(thread_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_ac_votes_target ON ac_votes(target_type, target_id)`;

  initialized = true;
}

export const COMMUNITY_CATEGORIES = [
  "SAIL",
  "Process Models",
  "Records",
  "Integrations",
  "CDTs",
  "Expression Rules",
  "Performance",
  "Design Patterns",
  "Portals",
  "Admin & DevOps",
  "General",
] as const;

export type CommunityCategory = typeof COMMUNITY_CATEGORIES[number];

export interface Thread {
  id: number;
  title: string;
  body: string;
  category: string;
  author_name: string;
  upvotes: number;
  reply_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reply {
  id: number;
  thread_id: number;
  body: string;
  author_name: string;
  upvotes: number;
  is_accepted: boolean;
  created_at: string;
}
