import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export async function RedirectIfSignedIn() {
  if (await getSession()) redirect("/");
  return null;
}
