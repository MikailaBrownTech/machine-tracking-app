import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StatusChangeForm } from "@/components/status-change-form";
import {
  PriorityBadge,
  statusLabel,
  WorkOrderStatusBadge,
} from "@/components/work-order-badges";
import { getWorkOrder, listWorkOrderEvents } from "@/db/queries/work-orders";
import { formatDateTime } from "@/lib/format";
import { can, requireUser } from "@/lib/session";
import { nextStatuses } from "@/lib/work-orders/transitions";
import { changeWorkOrderStatus } from "../actions";

async function WorkOrderDetails({
  params,
}: Pick<PageProps<"/work-orders/[id]">, "params">) {
  const user = await requireUser();
  const { id } = await params;
  const row = await getWorkOrder(id);
  if (!row) notFound();
  const { workOrder: wo } = row;
  const events = await listWorkOrderEvents(wo.id);
  const options = nextStatuses(wo.status).map((value) => ({
    value,
    label: statusLabel(value),
  }));

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">{wo.title}</h1>
        <WorkOrderStatusBadge status={wo.status} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-base">
        <dt className="text-muted-foreground">Asset</dt>
        <dd>
          <Link
            href={`/assets/${row.assetId}`}
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            {row.assetName}
          </Link>
        </dd>
        <dt className="text-muted-foreground">Priority</dt>
        <dd>
          <PriorityBadge priority={wo.priority} />
        </dd>
        <dt className="text-muted-foreground">Created</dt>
        <dd>{formatDateTime(wo.createdAt)}</dd>
        {wo.completedAt && (
          <>
            <dt className="text-muted-foreground">Completed</dt>
            <dd>{formatDateTime(wo.completedAt)}</dd>
          </>
        )}
      </dl>
      {wo.description && (
        <p className="whitespace-pre-wrap text-base">{wo.description}</p>
      )}
      {can(user.role, "write") && options.length > 0 && (
        <StatusChangeForm
          action={changeWorkOrderStatus.bind(null, wo.id)}
          current={wo.status}
          options={options}
        />
      )}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">History</h2>
        <ol className="flex flex-col gap-3">
          {events.map((e) => (
            <li key={e.id} className="rounded-lg border p-3 text-base">
              <p className="font-medium">
                {e.fromStatus ? statusLabel(e.fromStatus) : "created"} →{" "}
                {statusLabel(e.toStatus)}
              </p>
              <p className="text-sm text-muted-foreground">
                {e.actorName} · {formatDateTime(e.createdAt)}
              </p>
              {e.note && <p className="mt-1">{e.note}</p>}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

export default function WorkOrderPage({
  params,
}: PageProps<"/work-orders/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6">
      <Suspense fallback={<p className="text-base">Loading…</p>}>
        <WorkOrderDetails params={params} />
      </Suspense>
    </main>
  );
}
