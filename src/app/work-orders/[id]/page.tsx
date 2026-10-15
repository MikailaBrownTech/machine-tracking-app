import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EventTimeline } from "@/components/event-timeline";
import { Page } from "@/components/page";
import { WorkOrderSkeleton } from "@/components/skeletons";
import { StatusChangeForm } from "@/components/status-change-form";
import { StatusStepper } from "@/components/status-stepper";
import { Card } from "@/components/ui/card";
import {
  PriorityBadge,
  statusLabel,
  WorkOrderStatusBadge,
} from "@/components/work-order-badges";
import { getWorkOrder, listWorkOrderEvents } from "@/db/queries/work-orders";
import { formatDateTime, shortId } from "@/lib/format";
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
    <div className="grid gap-6 md:grid-cols-[1fr_22rem] md:items-start">
      <div className="flex flex-col gap-6">
        <Card className="gap-4 px-4 md:px-6">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm text-muted-foreground">
              WO-{shortId(wo.id)}
            </p>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {wo.title}
              </h1>
              <WorkOrderStatusBadge status={wo.status} />
            </div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 text-base">
            <dt className="text-muted-foreground">Asset</dt>
            <dd>
              <Link
                href={`/assets/${row.assetId}`}
                className="inline-flex min-h-tap items-center gap-1 font-medium underline underline-offset-4"
              >
                {row.assetName}
                <ChevronRight className="size-4" aria-hidden />
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
            <p className="border-t pt-4 text-base whitespace-pre-wrap">
              {wo.description}
            </p>
          )}
        </Card>

        <StatusStepper current={wo.status} />

        {can(user.role, "write") && options.length > 0 && (
          <StatusChangeForm
            action={changeWorkOrderStatus.bind(null, wo.id)}
            current={wo.status}
            options={options}
          />
        )}
      </div>

      <Card className="gap-4 px-4">
        <h2 className="text-xl font-semibold">History</h2>
        <EventTimeline events={events} />
      </Card>
    </div>
  );
}

export default function WorkOrderPage({
  params,
}: PageProps<"/work-orders/[id]">) {
  return (
    <Page>
      <Suspense fallback={<WorkOrderSkeleton />}>
        <WorkOrderDetails params={params} />
      </Suspense>
    </Page>
  );
}
