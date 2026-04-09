import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function check() {
  const constraints = await db.execute(sql`
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_name = 'topic_progress' AND constraint_type = 'UNIQUE'
  `);
  console.log("Unique constraints:", JSON.stringify(constraints.rows));
  process.exit(0);
}
check().catch((e) => { console.error(e.message); process.exit(1); });
