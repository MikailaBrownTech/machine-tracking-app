import { describe, expect, it } from "vitest";
import { assetInputSchema } from "./asset";

const valid = {
  name: "Lathe 1",
  type: "Lathe",
  location: "Bay 2",
  serial: "SN-1",
  status: "active",
};

describe("assetInputSchema", () => {
  it("accepts valid input", () => {
    expect(assetInputSchema.parse(valid)).toEqual(valid);
  });

  it("trims name and type", () => {
    const out = assetInputSchema.parse({
      ...valid,
      name: "  A  ",
      type: " T ",
    });
    expect(out.name).toBe("A");
    expect(out.type).toBe("T");
  });

  for (const field of ["name", "type"] as const) {
    for (const blank of ["", "   ", "\t\n"]) {
      it(`rejects blank ${field} ${JSON.stringify(blank)}`, () => {
        expect(
          assetInputSchema.safeParse({ ...valid, [field]: blank }).success,
        ).toBe(false);
      });
    }
  }

  it("turns empty or whitespace serial into null", () => {
    expect(assetInputSchema.parse({ ...valid, serial: "" }).serial).toBeNull();
    expect(
      assetInputSchema.parse({ ...valid, serial: "  " }).serial,
    ).toBeNull();
  });

  it("turns empty location into null", () => {
    expect(
      assetInputSchema.parse({ ...valid, location: "" }).location,
    ).toBeNull();
  });

  it("rejects an unknown status", () => {
    expect(
      assetInputSchema.safeParse({ ...valid, status: "broken" }).success,
    ).toBe(false);
  });

  it("rejects an oversize name", () => {
    expect(
      assetInputSchema.safeParse({ ...valid, name: "x".repeat(201) }).success,
    ).toBe(false);
  });
});
