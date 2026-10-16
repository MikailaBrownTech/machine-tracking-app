"use server";

import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { getAsset } from "@/db/queries/assets";
import { aiDrafts } from "@/db/schema";
import { env } from "@/env";
import { createAnthropicCompleter } from "@/lib/ai/anthropic";
import { draftIntake, type IntakeDraft } from "@/lib/ai/intake";
import { MAX_NOTE_CHARS } from "@/lib/ai/intake-prompt";
import { canDraft, DRAFT_WINDOW_MS } from "@/lib/ai/rate-limit";
import { requireRole } from "@/lib/session";

export type DraftResult =
  | { ok: true; draftId: string; draft: IntakeDraft }
  | { ok: false; error: string };

const FAILED = "Couldn't draft this, fill in the form manually.";

const inputSchema = z.object({
  assetId: z.uuid(),
  note: z
    .string()
    .trim()
    .min(1, "Describe the problem first")
    .max(MAX_NOTE_CHARS, `Keep it under ${MAX_NOTE_CHARS} characters`),
});

// Suggests only: nothing here creates or changes a work order.
export async function draftWorkOrder(
  assetId: string,
  note: string,
): Promise<DraftResult> {
  const user = await requireRole("owner", "tech");
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "AI drafting is not available." };

  const parsed = inputSchema.safeParse({ assetId, note });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const asset = await getAsset(parsed.data.assetId);
  if (!asset) return { ok: false, error: "Asset not found." };
  if (asset.status === "retired") {
    return { ok: false, error: "Retired assets cannot get new work orders." };
  }

  const [{ recentDrafts }] = await db
    .select({ recentDrafts: sql<number>`count(*)::int` })
    .from(aiDrafts)
    .where(
      and(
        eq(aiDrafts.userId, user.id),
        gt(aiDrafts.createdAt, new Date(Date.now() - DRAFT_WINDOW_MS)),
      ),
    );
  if (!canDraft(recentDrafts)) {
    return {
      ok: false,
      error: "Draft limit reached for this hour. Fill in the form manually.",
    };
  }

  const started = Date.now();
  const result = await draftIntake(
    {
      note: parsed.data.note,
      asset: { name: asset.name, type: asset.type, location: asset.location },
    },
    createAnthropicCompleter({ apiKey, model: env.AI_MODEL }),
  );
  const latencyMs = Date.now() - started;

  const [row] = await db
    .insert(aiDrafts)
    .values({
      userId: user.id,
      assetId: asset.id,
      note: parsed.data.note,
      output: result.ok ? result.draft : null,
      outcome: result.ok ? "ok" : result.reason,
      model: env.AI_MODEL,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      latencyMs,
    })
    .returning({ id: aiDrafts.id });

  if (!result.ok) {
    // One line per failure: no key, note or headers.
    console.error(
      `[ai-draft] outcome=${result.reason} ${result.detail} latency_ms=${latencyMs}`,
    );
    return { ok: false, error: FAILED };
  }
  return { ok: true, draftId: row.id, draft: result.draft };
}
