export const roles = ["owner", "tech", "viewer"] as const;
export type Role = (typeof roles)[number];

export type Action = "read" | "write";

const allowed: Record<Role, readonly Action[]> = {
  owner: ["read", "write"],
  tech: ["read", "write"],
  viewer: ["read"],
};

export function can(role: Role, action: Action): boolean {
  return allowed[role].includes(action);
}
