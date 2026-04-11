import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "../../drizzle/schema";
import * as relations from "../../drizzle/relations";

const fullSchema = { ...schema, ...relations };
type FullSchema = typeof fullSchema;

let _db: NeonHttpDatabase<FullSchema> | null = null;

function getDb(): NeonHttpDatabase<FullSchema> {
  if (!_db) {
    const sql: NeonQueryFunction<false, false> = neon(process.env.DATABASE_URL!);
    _db = drizzle(sql, { schema: fullSchema });
  }
  return _db;
}

export const db = new Proxy({} as NeonHttpDatabase<FullSchema>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
