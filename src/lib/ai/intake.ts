import { z } from "zod";
import { createWorkOrderSchema } from "../validation/work-order.ts";
import {
  buildUserMessage,
  SYSTEM_PROMPT,
  type IntakeAsset,
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
// `detail` is a short, secret-free description for the server log.
export type IntakeResult =
  | { ok: true; draft: IntakeDraft; usage: Usage }
  | { ok: false; reason: IntakeFailure; usage: Usage; detail: string };

const noUsage: Usage = { inputTokens: null, outputTokens: null };

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 500;
const QUESTION_MAX = 120;
const STEP_MAX = 160;
const MAX_QUESTIONS = 3;
const MAX_STEPS = 5;

// Cuts at the last sentence end, else the last space, else hard at max.
export function clampText(value: string, max: number): string {
  const text = value.trim();
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const floor = Math.floor(max / 2);
  let cut = -1;
  for (const m of head.matchAll(/[.!?](?=\s|$)/g)) cut = m.index + 1;
  if (cut < floor) cut = head.lastIndexOf(" ");
  if (cut < floor) cut = max;
  return head.slice(0, cut).trim();
}

function clampList(value: unknown, max: number, count: number): unknown {
  if (!Array.isArray(value)) return value;
  return value
    .map((item) => (typeof item === "string" ? clampText(item, max) : item))
    .filter((item) => item !== "")
    .slice(0, count);
}

function describeError(error: unknown): string {
  const e = error as {
    name?: unknown;
    message?: unknown;
    status?: unknown;
    error?: { error?: { type?: unknown } };
  } | null;
  const status = typeof e?.status === "number" ? e.status : "none";
  const apiType = e?.error?.error?.type;
  const type =
    typeof apiType === "string"
      ? apiType
      : typeof e?.name === "string"
        ? e.name
        : "unknown";
  const message = (typeof e?.message === "string" ? e.message : "")
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
    .slice(0, 200);
  return `status=${status} type=${type} message=${message}`;
}

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
  // Over-long text is clamped, not rejected: a human reviews every draft.
  // Structural problems (missing field, empty title, bad priority) still fail.
  const normalized: Record<string, unknown> = { ...raw };
  if (typeof normalized.title === "string") {
    normalized.title = clampText(normalized.title, TITLE_MAX);
  }
  if (typeof normalized.description === "string") {
    normalized.description = clampText(normalized.description, DESCRIPTION_MAX);
  }
  if (typeof normalized.rationale === "string") {
    normalized.rationale = clampText(normalized.rationale, 300);
  }
  normalized.questions = clampList(
    normalized.questions,
    QUESTION_MAX,
    MAX_QUESTIONS,
  );
  normalized.suggested_steps = clampList(
    normalized.suggested_steps,
    STEP_MAX,
    MAX_STEPS,
  );
  if (typeof normalized.priority === "string") {
    normalized.priority = normalized.priority.trim().toLowerCase();
  }
  const parsed = intakeDraftSchema.safeParse(normalized);
  return parsed.success ? parsed.data : null;
}

export async function draftIntake(
  input: { note: string; asset: IntakeAsset },
  complete: Complete,
): Promise<IntakeResult> {
  let completion: Completion;
  try {
    completion = await complete(SYSTEM_PROMPT, buildUserMessage(input));
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      usage: noUsage,
      detail: describeError(error),
    };
  }
  const usage: Usage = {
    inputTokens: completion.inputTokens,
    outputTokens: completion.outputTokens,
  };
  if (completion.stopReason === "refusal") {
    return {
      ok: false,
      reason: "refused",
      usage,
      detail: "stop_reason=refusal",
    };
  }
  // A truncated response is never trusted, even if it happens to parse.
  if (completion.stopReason === "max_tokens") {
    return {
      ok: false,
      reason: "invalid",
      usage,
      detail: "stop_reason=max_tokens",
    };
  }
  const draft = parseDraft(completion.text);
  if (!draft) {
    return {
      ok: false,
      reason: "invalid",
      usage,
      detail: `stop_reason=${completion.stopReason} reply failed structural validation`,
    };
  }
  return { ok: true, draft, usage };
}
