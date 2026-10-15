import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { roles, type Role } from "@/lib/permissions";

export { can } from "@/lib/permissions";
export type { Action, Role } from "@/lib/permissions";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

function toRole(value: unknown): Role {
  return roles.find((r) => r === value) ?? "viewer";
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { user } = session;
  // Deactivated after sign-in: treat existing sessions as signed out.
  if (user.deactivatedAt) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: toRole(user.role),
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireRole(...allowed: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) redirect("/");
  return user;
}
