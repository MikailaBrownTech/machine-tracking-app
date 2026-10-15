import { describe, expect, it } from "vitest";
import { can, type Action, type Role } from "./permissions";

const expected: Record<Role, Record<Action, boolean>> = {
  owner: { read: true, write: true },
  tech: { read: true, write: true },
  viewer: { read: true, write: false },
};

describe("can", () => {
  for (const role of Object.keys(expected) as Role[]) {
    for (const action of ["read", "write"] as const) {
      it(`${role} ${action} is ${expected[role][action]}`, () => {
        expect(can(role, action)).toBe(expected[role][action]);
      });
    }
  }
});
