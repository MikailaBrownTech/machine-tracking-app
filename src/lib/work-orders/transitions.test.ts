import { describe, expect, it } from "vitest";
import { workOrderStatus } from "../../db/schema";
import {
  canTransition,
  nextStatuses,
  workOrderStatuses,
  type WorkOrderStatus,
} from "./transitions";

const all: WorkOrderStatus[] = ["open", "in_progress", "done"];
const valid = new Set(["open>in_progress", "in_progress>done"]);

describe("canTransition", () => {
  for (const from of all) {
    for (const to of all) {
      const expected = valid.has(`${from}>${to}`);
      it(`${from} -> ${to} is ${expected}`, () => {
        expect(canTransition(from, to)).toBe(expected);
      });
    }
  }
});

describe("nextStatuses", () => {
  it("open -> [in_progress]", () => {
    expect(nextStatuses("open")).toEqual(["in_progress"]);
  });
  it("in_progress -> [done]", () => {
    expect(nextStatuses("in_progress")).toEqual(["done"]);
  });
  it("done -> []", () => {
    expect(nextStatuses("done")).toEqual([]);
  });
  it("does not expose the table to mutation", () => {
    const next = nextStatuses("open");
    next.push("done");
    next.length = 0;
    expect(nextStatuses("open")).toEqual(["in_progress"]);
    expect(canTransition("open", "done")).toBe(false);
  });
});

describe("schema drift guard", () => {
  it("table keys equal the work_order_status enum values", () => {
    expect([...workOrderStatuses].sort()).toEqual(
      [...workOrderStatus.enumValues].sort(),
    );
  });
});
