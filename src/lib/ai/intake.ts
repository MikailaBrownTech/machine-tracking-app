import { z } from "zod";
import { createWorkOrderSchema } from "../validation/work-order.ts";
import {
  buildUserMessage,
  SYSTEM_PROMPT,
  type IntakeAsset,
  type RecentWorkOrder,
} from "./intake-prompt.ts";

// The draft must satisfy the same constraints as a saved work order.
export const intakeDraftSchema = createWorkOrderSchema
  .extend({
    description: z.string().trim().min(1).max(500),
    rationale: z.string().trim().max(300),
    low_detail: z.boolean(),
    questions: z.array(z.string().trim().min(1).max(120)).max(3),
    suggested_steps: z.array(z.string().trim().min(1).max(160)).max(5),
  })
  .strict();
export type IntakeDraft = z.infer<typeof intakeDraftSchema>;

export type Completion = {
  stopReason: "end_turn" | "refusal" | "max_tokens" | "other";
  text: string;
  inputTokens: number | null;
  outputTokens: number | null;
};
export type Complete = (system: string, user: string) => Promise<Completion>;

export type IntakeFailure = "invalid" | "refused" | "error";
export type Usage = { inputTokens: number | null; outputTokens: number | null };
export type IntakeResult =
  | { ok: true; draft: IntakeDraft; usage: Usage }
  | { ok: false; reason: IntakeFailure; usage: Usage };

const noUsage: Usage = { inputTokens: null, outputTokens: null };

export function parseDraft(text: string): IntakeDraft | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const normalized: Record<string, unknown> = { ...raw };
  if (typeof normalized.priority === "string") {
    normalized.priority = normalized.priority.trim().toLowerCase();
  }
  const parsed = intakeDraftSchema.safeParse(normalized);
  return parsed.success ? parsed.data : null;
}

export async function draftIntake(
  input: { note: string; asset: IntakeAsset; recent: RecentWorkOrder[] },
  complete: Complete,
): Promise<IntakeResult> {
  let completion: Completion;
  try {
    completion = await complete(SYSTEM_PROMPT, buildUserMessage(input));
  } catch {
    return { ok: false, reason: "error", usage: noUsage };
  }
  const usage: Usage = {
    inputTokens: completion.inputTokens,
    outputTokens: completion.outputTokens,
  };
  if (completion.stopReason === "refusal") {
    return { ok: false, reason: "refused", usage };
  }
  // A truncated response is never trusted, even if it happens to parse.
  if (completion.stopReason === "max_tokens") {
    return { ok: false, reason: "invalid", usage };
  }
  const draft = parseDraft(completion.text);
  if (!draft) return { ok: false, reason: "invalid", usage };
  return { ok: true, draft, usage };
}
