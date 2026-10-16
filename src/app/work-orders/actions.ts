"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { aiDrafts, assets, workOrderEvents, workOrders } from "@/db/schema";
import { requireRole } from "@/lib/session";
import {
  changeStatusSchema,
  createWorkOrderSchema,
} from "@/lib/validation/work-order";
import { canTransition } from "@/lib/work-orders/transitions";

export type WorkOrderFormState = {
  errors?: Partial<
    Record<"title" | "description" | "priority" | "form", string>
  >;
  values?: Record<string, string>;
};

export type StatusChangeState = { error?: string };

const GENERIC_ERROR = "Could not save the work order. Please try again.";

// 23514 = CHECK violation; trigger exceptions surface as P0001 (raise_exception).
function isConstraintError(error: unknown): boolean {
  let current: unknown = error;
  for (let i = 0; i < 5 && typeof current === "object" && current; i++) {
    if (
      "code" in current &&
      (current.code === "23514" || current.code === "P0001")
    ) {
      return true;
    }
    current = "cause" in current ? current.cause : null;
  }
  return false;
}

function rawValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

export async function createWorkOrder(
  assetId: string,
  _prev: WorkOrderFormState,
  formData: FormData,
): Promise<WorkOrderFormState> {
  const user = await requireRole("owner", "tech");
  const values = rawValues(formData);
  if (!z.uuid().safeParse(assetId).success) {
    return { errors: { form: "Asset not found" }, values };
  }
  const parsed = createWorkOrderSchema.safeParse(values);
  if (!parsed.success) {
    const flat: Record<string, string[] | undefined> = z.flattenError(
      parsed.error,
    ).fieldErrors;
    const errors: WorkOrderFormState["errors"] = {};
    for (const field of ["title", "description", "priority"] as const) {
      const message = flat[field]?.[0];
      if (message) errors[field] = message;
    }
    return { errors, values };
  }

  const draftIdParsed = z.uuid().safeParse(values.draftId);
  const draftId = draftIdParsed.success ? draftIdParsed.data : null;

  let newId: string;
  try {
    const result = await db.transaction(async (tx) => {
      const [asset] = await tx
        .select({ status: assets.status })
        .from(assets)
        .where(eq(assets.id, assetId));
      if (!asset) return { error: "Asset not found" } as const;
      if (asset.status === "retired") {
        return { error: "Retired assets cannot get new work orders" } as const;
      }
      const [wo] = await tx
        .insert(workOrders)
        .values({
          assetId,
          title: parsed.data.title,
          description: parsed.data.description,
          priority: parsed.data.priority,
          status: "open",
          createdBy: user.id,
        })
        .returning({ id: workOrders.id });
      await tx.insert(workOrderEvents).values({
        workOrderId: wo.id,
        fromStatus: null,
        toStatus: "open",
        actorId: user.id,
      });
      // Link the AI draft once, only if it is this user's draft for this asset.
      if (draftId) {
        await tx
          .update(aiDrafts)
          .set({ acceptedWorkOrderId: wo.id })
          .where(
            and(
              eq(aiDrafts.id, draftId),
              eq(aiDrafts.userId, user.id),
              eq(aiDrafts.assetId, assetId),
              eq(aiDrafts.outcome, "ok"),
              isNull(aiDrafts.acceptedWorkOrderId),
            ),
          );
      }
      return { id: wo.id } as const;
    });
    if ("error" in result) return { errors: { form: result.error }, values };
    newId = result.id;
  } catch (error) {
    if (isConstraintError(error)) {
      return { errors: { form: GENERIC_ERROR }, values };
    }
    throw error;
  }
  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/work-orders");
  redirect(`/work-orders/${newId}`);
}

export async function changeWorkOrderStatus(
  workOrderId: string,
  _prev: StatusChangeState,
  formData: FormData,
): Promise<StatusChangeState> {
  const user = await requireRole("owner", "tech");
  if (!z.uuid().safeParse(workOrderId).success) {
    return { error: "Work order not found" };
  }
  const values = rawValues(formData);
  const parsed = changeStatusSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[] | undefined> = z.flattenError(
      parsed.error,
    ).fieldErrors;
    return { error: fieldErrors.note?.[0] ?? "Invalid input" };
  }
  const { toStatus, expectedFrom, note } = parsed.data;

  try {
    const message = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ status: workOrders.status })
        .from(workOrders)
        .where(eq(workOrders.id, workOrderId))
        .for("update");
      if (!current) return "Work order not found";
      if (current.status !== expectedFrom) {
        return "This work order changed, reload";
      }
      if (!canTransition(current.status, toStatus)) {
        return "That status change is not allowed";
      }
      await tx
        .update(workOrders)
        .set({
          status: toStatus,
          completedAt: toStatus === "done" ? sql`now()` : null,
        })
        .where(eq(workOrders.id, workOrderId));
      await tx.insert(workOrderEvents).values({
        workOrderId,
        fromStatus: current.status,
        toStatus,
        note,
        actorId: user.id,
      });
      return null;
    });
    if (message) return { error: message };
  } catch (error) {
    if (isConstraintError(error)) return { error: GENERIC_ERROR };
    throw error;
  }
  revalidatePath(`/work-orders/${workOrderId}`);
  revalidatePath("/work-orders");
  return {};
}
