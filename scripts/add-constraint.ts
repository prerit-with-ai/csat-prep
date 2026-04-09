import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql`
      ALTER TABLE topic_progress
      ADD CONSTRAINT topic_progress_user_topic_unique UNIQUE (user_id, topic_id)
    `);
    console.log("Unique constraint added successfully");
  } catch (e: unknown) {
    const err = e as Error;
    console.log("Result:", err.message);
  }
  process.exit(0);
}
run();
