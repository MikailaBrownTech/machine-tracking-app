import { Wrench } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ChromeGate, BottomTabs, DesktopNav } from "@/components/nav";
import { UserMenuClient } from "@/components/user-menu";
import { getSession } from "@/lib/session";

async function UserMenu() {
  const user = await getSession();
  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="flex h-tap items-center rounded-lg px-3 text-base font-medium"
      >
        Sign in
      </Link>
    );
  }
  return <UserMenuClient email={user.email} role={user.role} />;
}

export function Brand() {
  return (
    <Link href="/" className="flex h-tap items-center gap-2.5">
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      >
        <Wrench className="size-5" />
      </span>
      <span className="text-lg font-bold tracking-tight">Maintenance</span>
    </Link>
  );
}

export function AppHeader() {
  return (
    <ChromeGate>
      <header className="sticky top-0 z-30 border-b bg-card print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Brand />
            <DesktopNav />
          </div>
          <Suspense fallback={<div className="size-tap" aria-hidden />}>
            <UserMenu />
          </Suspense>
        </div>
      </header>
    </ChromeGate>
  );
}

export function AppTabs() {
  return (
    <ChromeGate>
      <BottomTabs />
    </ChromeGate>
  );
}
