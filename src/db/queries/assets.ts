import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { assets } from "@/db/schema";

export type Asset = typeof assets.$inferSelect;

// Retired assets sort last.
export async function listAssets(): Promise<Asset[]> {
  return db
    .select()
    .from(assets)
    .orderBy(sql`${assets.status} = 'retired'`, asc(assets.name));
}

export async function getAsset(id: string): Promise<Asset | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const [row] = await db.select().from(assets).where(eq(assets.id, id));
  return row ?? null;
}
