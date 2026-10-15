import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { assets, users, workOrderEvents, workOrders } from "@/db/schema";

export type WorkOrder = typeof workOrders.$inferSelect;

export async function listWorkOrdersForAsset(
  assetId: string,
): Promise<WorkOrder[]> {
  return db
    .select()
    .from(workOrders)
    .where(eq(workOrders.assetId, assetId))
    .orderBy(desc(workOrders.createdAt));
}

export async function getWorkOrder(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const [row] = await db
    .select({
      workOrder: workOrders,
      assetId: assets.id,
      assetName: assets.name,
    })
    .from(workOrders)
    .innerJoin(assets, eq(assets.id, workOrders.assetId))
    .where(eq(workOrders.id, id));
  return row ?? null;
}

export async function listOpenWorkOrders() {
  return db
    .select({ workOrder: workOrders, assetName: assets.name })
    .from(workOrders)
    .innerJoin(assets, eq(assets.id, workOrders.assetId))
    .where(ne(workOrders.status, "done"))
    .orderBy(desc(workOrders.createdAt));
}

export async function listWorkOrderEvents(workOrderId: string) {
  return db
    .select({
      id: workOrderEvents.id,
      fromStatus: workOrderEvents.fromStatus,
      toStatus: workOrderEvents.toStatus,
      note: workOrderEvents.note,
      createdAt: workOrderEvents.createdAt,
      actorName: users.name,
    })
    .from(workOrderEvents)
    .innerJoin(users, eq(users.id, workOrderEvents.actorId))
    .where(eq(workOrderEvents.workOrderId, workOrderId))
    .orderBy(asc(workOrderEvents.createdAt));
}

export type DashboardCounts = {
  open: number;
  inProgress: number;
  doneLast7Days: number;
};

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const [row] = await db
    .select({
      open: sql<number>`count(*) filter (where ${workOrders.status} = 'open')::int`,
      inProgress: sql<number>`count(*) filter (where ${workOrders.status} = 'in_progress')::int`,
      doneLast7Days: sql<number>`count(*) filter (where ${workOrders.status} = 'done' and ${workOrders.completedAt} >= now() - interval '7 days')::int`,
    })
    .from(workOrders);
  return row ?? { open: 0, inProgress: 0, doneLast7Days: 0 };
}

// High-priority work orders nobody has started yet, oldest first.
export async function listNeedsAttention(limit = 5) {
  return db
    .select({ workOrder: workOrders, assetName: assets.name })
    .from(workOrders)
    .innerJoin(assets, eq(assets.id, workOrders.assetId))
    .where(and(eq(workOrders.status, "open"), eq(workOrders.priority, "high")))
    .orderBy(asc(workOrders.createdAt))
    .limit(limit);
}
