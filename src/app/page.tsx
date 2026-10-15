import { ClipboardList, PartyPopper } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { Page, PageHeader } from "@/components/page";
import { ListSkeleton, StatTilesSkeleton } from "@/components/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { WorkOrderList } from "@/components/work-order-list";
import {
  getDashboardCounts,
  listNeedsAttention,
} from "@/db/queries/work-orders";
import { can, requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

const tiles = [
  {
    key: "open",
    label: "Open",
    href: "/work-orders",
    accent: "border-t-open",
    ink: "text-open-ink",
  },
  {
    key: "inProgress",
    label: "In progress",
    href: "/work-orders",
    accent: "border-t-progress",
    ink: "text-progress-ink",
  },
  {
    key: "doneLast7Days",
    label: "Done, last 7 days",
    href: "/work-orders",
    accent: "border-t-done",
    ink: "text-done-ink",
  },
] as const;

async function Stats() {
  await requireUser();
  const counts = await getDashboardCounts();
  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={cn(
            "flex min-h-28 flex-col justify-between gap-2 rounded-xl border border-t-4 bg-card p-3 transition-colors hover:bg-muted md:p-4",
            t.accent,
          )}
        >
          <span className="text-base font-medium text-muted-foreground">
            {t.label}
          </span>
          <span
            className={cn(
              "font-mono text-4xl leading-none font-medium md:text-5xl",
              t.ink,
            )}
          >
            {counts[t.key]}
          </span>
        </Link>
      ))}
    </div>
  );
}

async function NeedsAttention() {
  const user = await requireUser();
  const rows = await listNeedsAttention();
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={PartyPopper}
        title="Nothing urgent"
        description="No high-priority work orders are waiting to be started."
        action={
          can(user.role, "write") ? (
            <Link
              href="/assets"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Browse assets
            </Link>
          ) : undefined
        }
      />
    );
  }
  return <WorkOrderList rows={rows} />;
}

export default function Home() {
  return (
    <Page>
      <PageHeader
        title="Dashboard"
        actions={
          <Link
            href="/work-orders"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            <ClipboardList aria-hidden />
            All work orders
          </Link>
        }
      />
      <Suspense fallback={<StatTilesSkeleton />}>
        <Stats />
      </Suspense>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Needs attention</h2>
        <Suspense fallback={<ListSkeleton rows={2} />}>
          <NeedsAttention />
        </Suspense>
      </section>
    </Page>
  );
}
