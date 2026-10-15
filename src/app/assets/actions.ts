"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { assets, assetStatus } from "@/db/schema";
import { requireRole } from "@/lib/session";
import { assetInputSchema, type AssetInput } from "@/lib/validation/asset";

export type AssetField = "name" | "type" | "location" | "serial" | "status";

export type AssetFormState = {
  errors?: Partial<Record<AssetField | "form", string>>;
  values?: Record<string, string>;
};

function hasUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let i = 0; i < 5 && typeof current === "object" && current; i++) {
    if ("code" in current && current.code === "23505") return true;
    current = "cause" in current ? current.cause : null;
  }
  return false;
}

function parseForm(
  formData: FormData,
): { ok: true; data: AssetInput } | { ok: false; state: AssetFormState } {
  const values = rawValues(formData);
  const parsed = assetInputSchema.safeParse(values);
  if (parsed.success) return { ok: true, data: parsed.data };
  const flat: Record<string, string[] | undefined> = z.flattenError(
    parsed.error,
  ).fieldErrors;
  const errors: AssetFormState["errors"] = {};
  for (const field of [
    "name",
    "type",
    "location",
    "serial",
    "status",
  ] as const) {
    const message = flat[field]?.[0];
    if (message) errors[field] = message;
  }
  return { ok: false, state: { errors, values } };
}

function toRow(data: AssetInput) {
  // assets.location is NOT NULL; an empty location is stored as "".
  return { ...data, location: data.location ?? "" };
}

function rawValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

const serialTaken: AssetFormState["errors"] = {
  serial: "Serial already in use",
};

export async function createAsset(
  _prev: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  await requireRole("owner", "tech");
  const result = parseForm(formData);
  if (!result.ok) return result.state;
  try {
    await db.insert(assets).values(toRow(result.data));
  } catch (error) {
    if (hasUniqueViolation(error)) {
      return { errors: serialTaken, values: rawValues(formData) };
    }
    throw error;
  }
  revalidatePath("/assets");
  redirect("/assets");
}

export async function updateAsset(
  id: string,
  _prev: AssetFormState,
  formData: FormData,
): Promise<AssetFormState> {
  await requireRole("owner", "tech");
  const idCheck = z.uuid().safeParse(id);
  if (!idCheck.success) return { errors: { form: "Asset not found" } };
  const result = parseForm(formData);
  if (!result.ok) return result.state;
  try {
    const updated = await db
      .update(assets)
      .set(toRow(result.data))
      .where(eq(assets.id, id))
      .returning({ id: assets.id });
    if (updated.length === 0) return { errors: { form: "Asset not found" } };
  } catch (error) {
    if (hasUniqueViolation(error)) {
      return { errors: serialTaken, values: rawValues(formData) };
    }
    throw error;
  }
  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  redirect(`/assets/${id}`);
}

export async function setAssetStatus(
  id: string,
  status: (typeof assetStatus.enumValues)[number],
): Promise<void> {
  await requireRole("owner", "tech");
  const parsed = z
    .object({ id: z.uuid(), status: z.enum(assetStatus.enumValues) })
    .parse({ id, status });
  await db
    .update(assets)
    .set({ status: parsed.status })
    .where(eq(assets.id, parsed.id));
  revalidatePath("/assets");
  revalidatePath(`/assets/${parsed.id}`);
  redirect(`/assets/${parsed.id}`);
}
