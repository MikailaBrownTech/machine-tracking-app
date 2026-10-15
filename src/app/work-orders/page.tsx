import Link from "next/link";
import { Suspense } from "react";
import {
  PriorityBadge,
  WorkOrderStatusBadge,
} from "@/components/work-order-badges";
import { listOpenWorkOrders } from "@/db/queries/work-orders";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/lib/session";

async function OpenWorkOrders() {
  await requireUser();
  const rows = await listOpenWorkOrders();
  if (rows.length === 0) {
    return (
      <p className="text-base text-muted-foreground">No open work orders.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {rows.map(({ workOrder: wo, assetName }) => (
        <li key={wo.id}>
          <Link
            href={`/work-orders/${wo.id}`}
            className="flex min-h-11 flex-col gap-1 rounded-lg border p-3 text-base"
          >
            <span className="font-medium">{wo.title}</span>
            <span className="text-sm text-muted-foreground">{assetName}</span>
            <span className="flex flex-wrap items-center gap-2">
              <WorkOrderStatusBadge status={wo.status} />
              <PriorityBadge priority={wo.priority} />
              <span className="text-sm text-muted-foreground">
                {formatDateTime(wo.createdAt)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function WorkOrdersPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Work orders</h1>
      <Suspense fallback={<p className="text-base">Loading…</p>}>
        <OpenWorkOrders />
      </Suspense>
    </main>
  );
}
