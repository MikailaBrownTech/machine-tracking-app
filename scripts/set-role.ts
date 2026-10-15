import nextEnv from "@next/env";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, sql } from "drizzle-orm";
import * as schema from "../src/db/schema.ts";

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set");

const [email, role] = process.argv.slice(2);
const parsedRole = schema.userRole.enumValues.find((r) => r === role);
if (!email || !parsedRole) {
  console.error(
    `Usage: npm run set-role <email> <${schema.userRole.enumValues.join("|")}>`,
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool, { schema });

async function main() {
  const updated = await db
    .update(schema.users)
    .set({ role: parsedRole, updatedAt: new Date() })
    .where(eq(sql`lower(${schema.users.email})`, email.toLowerCase()))
    .returning({ email: schema.users.email, role: schema.users.role });
  if (updated.length === 0) throw new Error(`No user with email ${email}`);
  console.log(`${updated[0].email} is now ${updated[0].role}`);
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
