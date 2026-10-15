import { statusLabel } from "@/components/work-order-badges";
import { formatDateTime } from "@/lib/format";
import type { WorkOrderStatus } from "@/lib/work-orders/transitions";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  fromStatus: WorkOrderStatus | null;
  toStatus: WorkOrderStatus;
  note: string | null;
  createdAt: Date;
  actorName: string;
};

const dot: Record<WorkOrderStatus, string> = {
  open: "bg-open",
  in_progress: "bg-progress",
  done: "bg-done",
};

export function EventTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="flex flex-col">
      {events.map((e, i) => (
        <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
          {i < events.length - 1 && (
            <span
              aria-hidden
              className="absolute top-5 bottom-0 left-[0.6875rem] w-0.5 bg-border"
            />
          )}
          <span
            aria-hidden
            className={cn(
              "relative mt-1 size-6 shrink-0 rounded-full border-4 border-background ring-2 ring-border",
              dot[e.toStatus],
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold capitalize">
              {e.fromStatus ? statusLabel(e.fromStatus) : "created"} →{" "}
              {statusLabel(e.toStatus)}
            </p>
            <p className="text-sm text-muted-foreground">
              {e.actorName} · {formatDateTime(e.createdAt)}
            </p>
            {e.note && (
              <p className="mt-1 text-base whitespace-pre-wrap">{e.note}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
