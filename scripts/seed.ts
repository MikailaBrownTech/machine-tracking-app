import nextEnv from "@next/env";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../src/db/schema.ts";

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set");

const pool = new Pool({ connectionString: url });
const db = drizzle(pool, { schema });

async function main() {
  const existing = await db
    .select({ id: schema.assets.id })
    .from(schema.assets)
    .limit(1);
  if (existing.length > 0) {
    throw new Error("assets already has rows; refusing to seed");
  }

  await db.transaction(async (tx) => {
    const [owner] = await tx
      .insert(schema.users)
      .values({
        id: "seed-owner",
        name: "Seed Owner",
        email: "owner@example.com",
        role: "owner",
      })
      .returning();

    const assets = await tx
      .insert(schema.assets)
      .values([
        {
          name: "CNC Mill #1",
          type: "CNC",
          location: "Bay A",
          serial: "CNC-0001",
        },
        {
          name: "Air Compressor",
          type: "Compressor",
          location: "Utility Room",
          serial: "AC-1000",
        },
        {
          name: "Forklift 2",
          type: "Forklift",
          location: "Warehouse",
          serial: "FL-0002",
        },
        { name: "Lathe", type: "Lathe", location: "Bay B", status: "inactive" },
        {
          name: "Old Press",
          type: "Press",
          location: "Storage",
          status: "retired",
        },
      ])
      .returning();

    const now = new Date();
    const earlier = new Date(now.getTime() - 60 * 60 * 1000);

    const [wo1, wo2, wo3] = await tx
      .insert(schema.workOrders)
      .values([
        {
          assetId: assets[0].id,
          title: "Replace spindle belt",
          description: "Belt is worn and slipping.",
          priority: "high",
          createdBy: owner.id,
          createdAt: earlier,
        },
        {
          assetId: assets[1].id,
          title: "Drain condensate tank",
          priority: "low",
          status: "in_progress",
          createdBy: owner.id,
          assignedTo: owner.id,
          createdAt: earlier,
        },
        {
          assetId: assets[2].id,
          title: "Inspect hydraulic hoses",
          priority: "medium",
          status: "done",
          createdBy: owner.id,
          createdAt: earlier,
          completedAt: now,
        },
      ])
      .returning();

    await tx.insert(schema.workOrderEvents).values([
      {
        workOrderId: wo1.id,
        fromStatus: null,
        toStatus: "open",
        actorId: owner.id,
        createdAt: earlier,
      },
      {
        workOrderId: wo2.id,
        fromStatus: null,
        toStatus: "open",
        actorId: owner.id,
        createdAt: earlier,
      },
      {
        workOrderId: wo2.id,
        fromStatus: "open",
        toStatus: "in_progress",
        actorId: owner.id,
        createdAt: now,
      },
      {
        workOrderId: wo3.id,
        fromStatus: null,
        toStatus: "open",
        actorId: owner.id,
        createdAt: earlier,
      },
      {
        workOrderId: wo3.id,
        fromStatus: "open",
        toStatus: "in_progress",
        actorId: owner.id,
        createdAt: earlier,
      },
      {
        workOrderId: wo3.id,
        fromStatus: "in_progress",
        toStatus: "done",
        note: "No issues found",
        actorId: owner.id,
        createdAt: now,
      },
    ]);
  });

  console.log("Seeded 1 user, 5 assets, 3 work orders, 6 events.");
}

main()
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
