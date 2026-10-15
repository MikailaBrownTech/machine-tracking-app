import { describe, expect, it } from "vitest";
import { changeStatusSchema, createWorkOrderSchema } from "./work-order";

describe("createWorkOrderSchema", () => {
  const valid = {
    title: "Fix belt",
    description: "Slipping",
    priority: "high",
  };

  it("accepts valid input", () => {
    expect(createWorkOrderSchema.parse(valid)).toEqual(valid);
  });

  it("defaults description to empty", () => {
    const out = createWorkOrderSchema.parse({ title: "T", priority: "low" });
    expect(out.description).toBe("");
  });

  for (const blank of ["", "   ", "\t\n"]) {
    it(`rejects blank title ${JSON.stringify(blank)}`, () => {
      expect(
        createWorkOrderSchema.safeParse({ ...valid, title: blank }).success,
      ).toBe(false);
    });
  }

  it("rejects an oversize title", () => {
    expect(
      createWorkOrderSchema.safeParse({ ...valid, title: "x".repeat(201) })
        .success,
    ).toBe(false);
  });

  it("rejects an unknown priority", () => {
    expect(
      createWorkOrderSchema.safeParse({ ...valid, priority: "urgent" }).success,
    ).toBe(false);
  });
});

describe("changeStatusSchema", () => {
  const valid = { toStatus: "in_progress", expectedFrom: "open", note: "Go" };

  it("accepts valid input", () => {
    expect(changeStatusSchema.parse(valid)).toEqual(valid);
  });

  it("defaults note to empty", () => {
    const out = changeStatusSchema.parse({
      toStatus: "done",
      expectedFrom: "in_progress",
    });
    expect(out.note).toBe("");
  });

  it("accepts a 500-char note and rejects 501", () => {
    expect(
      changeStatusSchema.safeParse({ ...valid, note: "x".repeat(500) }).success,
    ).toBe(true);
    expect(
      changeStatusSchema.safeParse({ ...valid, note: "x".repeat(501) }).success,
    ).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(
      changeStatusSchema.safeParse({ ...valid, toStatus: "closed" }).success,
    ).toBe(false);
  });
});
