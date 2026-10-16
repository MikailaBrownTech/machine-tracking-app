import { describe, expect, it } from "vitest";
import { createWorkOrderSchema } from "../validation/work-order";
import { composeDescription, STEPS_HEADING } from "./compose";

describe("composeDescription", () => {
  it("appends heading and bullets after a blank line", () => {
    expect(composeDescription("Belt squeals.", ["Check A", "Inspect B"])).toBe(
      `Belt squeals.\n\n${STEPS_HEADING}\n- Check A\n- Inspect B`,
    );
  });

  it("returns the description alone when there are no steps", () => {
    expect(composeDescription("Belt squeals.", [])).toBe("Belt squeals.");
  });

  it("fits createWorkOrder's description limit at maximum size", () => {
    const text = composeDescription(
      "d".repeat(500),
      Array.from({ length: 5 }, () => "s".repeat(160)),
    );
    expect(
      createWorkOrderSchema.safeParse({
        title: "t",
        description: text,
        priority: "low",
      }).success,
    ).toBe(true);
  });
});
