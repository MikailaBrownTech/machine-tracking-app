"use client";

import {
  ClipboardList,
  LayoutDashboard,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Wrench },
  { href: "/work-orders", label: "Work orders", icon: ClipboardList },
];

const authPaths = ["/sign-in", "/sign-up"];

function isActive(pathname: string, href: string): boolean {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-tap items-center gap-2 rounded-lg px-3 text-base font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
    >
      <ul className="grid h-tabbar grid-cols-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full min-h-tap flex-col items-center justify-center gap-1 text-sm font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-primary"
                  />
                )}
                <Icon className="size-6" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Sign-in and sign-up render without the app chrome.
function Gate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (authPaths.includes(pathname)) return null;
  return <>{children}</>;
}

export function ChromeGate({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}
