import Link from "next/link";
import { Suspense } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/session";

async function UserMenu() {
  const user = await getSession();
  if (!user) {
    return (
      <Link href="/sign-in" className="flex h-12 items-center text-base">
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="min-w-0 max-w-[9rem] truncate text-sm sm:max-w-xs">
        {user.email}
      </span>
      <Badge variant="secondary">{user.role}</Badge>
      <SignOutButton className="h-11 px-3 text-sm" />
    </div>
  );
}

export function AppHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 border-b px-4 print:hidden">
      <nav className="flex items-center gap-4">
        <Link href="/" className="flex h-12 items-center text-base">
          Home
        </Link>
        <Link href="/assets" className="flex h-12 items-center text-base">
          Assets
        </Link>
        <Link href="/work-orders" className="flex h-12 items-center text-base">
          Work orders
        </Link>
      </nav>
      <Suspense fallback={<div className="h-12" aria-hidden />}>
        <UserMenu />
      </Suspense>
    </header>
  );
}
