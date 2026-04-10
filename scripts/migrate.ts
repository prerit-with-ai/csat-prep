/**
 * Safe migration script: applies schema additions using IF NOT EXISTS.
 * Safe to run on both dev (tables already exist) and prod (tables may be missing).
 * Run with: npx tsx scripts/migrate.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(connectionString);

const migrations = [
  // Slice 5: user_settings table
  `CREATE TABLE IF NOT EXISTS "user_settings" (
    "user_id" text PRIMARY KEY NOT NULL,
    "exam_date" timestamp,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE
  )`,

  // Slice 8: passages table
  `CREATE TABLE IF NOT EXISTS "passages" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "topic_id" uuid NOT NULL,
    "title" text NOT NULL,
    "passage_text" text NOT NULL,
    "difficulty" text DEFAULT 'l2' NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE
  )`,

  // Slice 8: passageId column on questions
  `ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "passage_id" uuid REFERENCES "passages"("id") ON DELETE SET NULL`,
];

async function main() {
  console.log("Running migrations...");
  for (const ddl of migrations) {
    console.log("  Applying:", ddl.split("\n")[0].trim().slice(0, 60) + "...");
    await sql.query(ddl);
  }
  console.log("Migrations complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
