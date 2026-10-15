import { describe, expect, it } from "vitest";
import { workOrderPriority } from "../../db/schema";
import {
  draftIntake,
  intakeDraftSchema,
  parseDraft,
  type Complete,
  type Completion,
} from "./intake";
import { intakeJsonSchema } from "./intake-schema";
import { canDraft } from "./rate-limit";

const valid = {
  title: "Replace squealing belt",
  description: "Belt squeals under load.\n\nUnknowns: belt size.",
  priority: "medium",
  rationale: "Degraded but running.",
};

const input = {
  note: "belt squeals",
  asset: { name: "Mill", type: "CNC", location: "Bay A" },
  recent: [],
};

function completion(over: Partial<Completion>): Completion {
  return {
    stopReason: "end_turn",
    text: JSON.stringify(valid),
    inputTokens: 100,
    outputTokens: 50,
    ...over,
  };
}

describe("parseDraft", () => {
  it("accepts a valid draft", () => {
    expect(parseDraft(JSON.stringify(valid))).toEqual(valid);
  });

  it("normalizes enum casing", () => {
    const draft = parseDraft(JSON.stringify({ ...valid, priority: " HIGH " }));
    expect(draft?.priority).toBe("high");
  });

  it("rejects a missing title", () => {
    const rest = Object.fromEntries(
      Object.entries(valid).filter(([key]) => key !== "title"),
    );
    expect(parseDraft(JSON.stringify(rest))).toBeNull();
  });

  it("rejects a blank or too long title", () => {
    expect(parseDraft(JSON.stringify({ ...valid, title: "  " }))).toBeNull();
    expect(
      parseDraft(JSON.stringify({ ...valid, title: "t".repeat(201) })),
    ).toBeNull();
  });

  it("rejects a too long description", () => {
    expect(
      parseDraft(JSON.stringify({ ...valid, description: "d".repeat(5001) })),
    ).toBeNull();
  });

  it("rejects extra keys", () => {
    expect(parseDraft(JSON.stringify({ ...valid, extra: 1 }))).toBeNull();
  });

  it("rejects an unknown priority", () => {
    expect(
      parseDraft(JSON.stringify({ ...valid, priority: "urgent" })),
    ).toBeNull();
  });

  it("rejects invalid JSON and non-objects", () => {
    expect(parseDraft("not json")).toBeNull();
    expect(parseDraft("[]")).toBeNull();
    expect(parseDraft("null")).toBeNull();
  });
});

describe("draftIntake", () => {
  const run = (c: Completion | Error) => {
    const complete: Complete = async () => {
      if (c instanceof Error) throw c;
      return c;
    };
    return draftIntake(input, complete);
  };

  it("returns the draft and usage on success", async () => {
    const result = await run(completion({}));
    expect(result).toEqual({
      ok: true,
      draft: valid,
      usage: { inputTokens: 100, outputTokens: 50 },
    });
  });

  it("treats a refusal as a failure", async () => {
    const result = await run(completion({ stopReason: "refusal", text: "" }));
    expect(result).toMatchObject({ ok: false, reason: "refused" });
  });

  it("treats max_tokens as a failure even if the text parses", async () => {
    const result = await run(completion({ stopReason: "max_tokens" }));
    expect(result).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("returns invalid for unparseable output", async () => {
    const result = await run(completion({ text: "sorry" }));
    expect(result).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("returns error when the completer throws", async () => {
    const result = await run(new Error("network"));
    expect(result).toMatchObject({ ok: false, reason: "error" });
  });

  it("passes the system prompt and delimited note to the completer", async () => {
    let seen: { system: string; user: string } | null = null;
    await draftIntake(input, async (system, user) => {
      seen = { system, user };
      return completion({});
    });
    expect(seen).not.toBeNull();
    expect(seen!.user).toContain("<tech_note>");
  });
});

describe("canDraft", () => {
  it("allows up to 19 and blocks at 20", () => {
    expect(canDraft(0)).toBe(true);
    expect(canDraft(19)).toBe(true);
    expect(canDraft(20)).toBe(false);
    expect(canDraft(99)).toBe(false);
  });
});

describe("JSON schema drift guard", () => {
  it("lists the same keys as the Zod schema, all required", () => {
    const zodKeys = Object.keys(intakeDraftSchema.shape).sort();
    expect(Object.keys(intakeJsonSchema.properties).sort()).toEqual(zodKeys);
    expect([...intakeJsonSchema.required].sort()).toEqual(zodKeys);
    expect(intakeJsonSchema.additionalProperties).toBe(false);
  });

  it("has the same priority enum as the database", () => {
    expect([...intakeJsonSchema.properties.priority.enum]).toEqual([
      ...workOrderPriority.enumValues,
    ]);
  });
});
