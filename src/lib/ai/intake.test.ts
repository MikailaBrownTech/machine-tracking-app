import { describe, expect, it } from "vitest";
import { workOrderPriority } from "../../db/schema";
import { createWorkOrderSchema } from "../validation/work-order";
import { composeDescription } from "./compose";
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
  description: "Belt squeals under load. No further detail provided.",
  priority: "medium",
  rationale: "Degraded but running.",
  low_detail: false,
  questions: [] as string[],
  suggested_steps: ["Check the belt tension.", "Replace if worn."],
};

const input = {
  note: "belt squeals",
  asset: { name: "Mill", type: "CNC", location: "Bay A" },
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

  it("rejects a blank title but clamps a too long one", () => {
    expect(parseDraft(JSON.stringify({ ...valid, title: "  " }))).toBeNull();
    const draft = parseDraft(
      JSON.stringify({ ...valid, title: "t".repeat(201) }),
    );
    expect(draft?.title).toHaveLength(200);
  });

  it("rejects an empty title", () => {
    expect(parseDraft(JSON.stringify({ ...valid, title: "" }))).toBeNull();
  });

  it("rejects an empty description but clamps a too long one", () => {
    expect(
      parseDraft(JSON.stringify({ ...valid, description: " " })),
    ).toBeNull();
    const draft = parseDraft(
      JSON.stringify({ ...valid, description: "d".repeat(501) }),
    );
    expect(draft?.description).toHaveLength(500);
  });

  it("cuts long text at the last sentence, else the last word", () => {
    const sentences = `${"First sentence here. ".repeat(30)}`;
    const a = parseDraft(JSON.stringify({ ...valid, description: sentences }));
    expect(a?.description.length).toBeLessThanOrEqual(500);
    expect(a?.description.endsWith(".")).toBe(true);
    const words = "word ".repeat(200);
    const b = parseDraft(JSON.stringify({ ...valid, description: words }));
    expect(b?.description.endsWith("word")).toBe(true);
  });

  it("clamps the composed description to the final limit", () => {
    const draft = parseDraft(
      JSON.stringify({
        ...valid,
        description: "d ".repeat(600),
        suggested_steps: Array.from({ length: 9 }, () => "s ".repeat(200)),
      }),
    );
    expect(draft).not.toBeNull();
    const text = composeDescription(draft!.description, draft!.suggested_steps);
    expect(
      createWorkOrderSchema.safeParse({
        title: draft!.title,
        description: text,
        priority: draft!.priority,
      }).success,
    ).toBe(true);
  });

  it("accepts low_detail with questions", () => {
    const draft = {
      ...valid,
      low_detail: true,
      questions: ["Which part is pressing?", "Since when?"],
    };
    expect(parseDraft(JSON.stringify(draft))).toEqual(draft);
  });

  it("drops questions beyond 3 and clamps one over 120 chars", () => {
    const four = ["a", "b", "c", "d"];
    const draft = parseDraft(
      JSON.stringify({ ...valid, low_detail: true, questions: four }),
    );
    expect(draft?.questions).toEqual(["a", "b", "c"]);
    const long = parseDraft(
      JSON.stringify({ ...valid, questions: ["q".repeat(121)] }),
    );
    expect(long?.questions[0]).toHaveLength(120);
  });

  it("accepts up to 5 steps and an empty array", () => {
    const five = ["a", "b", "c", "d", "e"];
    expect(
      parseDraft(JSON.stringify({ ...valid, suggested_steps: five })),
    ).not.toBeNull();
    expect(
      parseDraft(JSON.stringify({ ...valid, suggested_steps: [] })),
    ).not.toBeNull();
  });

  it("drops steps beyond 5, drops empty steps and clamps one over 160 chars", () => {
    const six = ["a", "b", "c", "d", "e", "f"];
    expect(
      parseDraft(JSON.stringify({ ...valid, suggested_steps: six }))
        ?.suggested_steps,
    ).toEqual(["a", "b", "c", "d", "e"]);
    expect(
      parseDraft(JSON.stringify({ ...valid, suggested_steps: ["", "a"] }))
        ?.suggested_steps,
    ).toEqual(["a"]);
    const long = parseDraft(
      JSON.stringify({ ...valid, suggested_steps: ["s".repeat(161)] }),
    );
    expect(long?.suggested_steps[0]).toHaveLength(160);
  });

  it("requires low_detail, questions and suggested_steps", () => {
    for (const key of ["low_detail", "questions", "suggested_steps"]) {
      const rest = Object.fromEntries(
        Object.entries(valid).filter(([k]) => k !== key),
      );
      expect(parseDraft(JSON.stringify(rest))).toBeNull();
    }
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

  it("logs status and type for API errors without leaking a key", async () => {
    const apiError = Object.assign(
      new Error("400 bad sk-ant-secret123 schema"),
      {
        status: 400,
        error: { error: { type: "invalid_request_error" } },
      },
    );
    const result = await run(apiError);
    expect(result).toMatchObject({ ok: false, reason: "error" });
    if (!result.ok) {
      expect(result.detail).toContain("status=400");
      expect(result.detail).toContain("type=invalid_request_error");
      expect(result.detail).not.toContain("secret123");
    }
  });

  it("succeeds with a clamped draft when fields are over-long", async () => {
    const text = JSON.stringify({
      ...valid,
      description: "d ".repeat(400),
      suggested_steps: Array.from({ length: 8 }, () => "s ".repeat(100)),
    });
    const result = await run(completion({ text }));
    expect(result.ok).toBe(true);
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
