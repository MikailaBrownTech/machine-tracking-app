import { Badge } from "@/components/ui/badge";
import type { WorkOrder } from "@/db/queries/work-orders";
import { cn } from "@/lib/utils";

const statusVariants = {
  open: "open",
  in_progress: "progress",
  done: "done",
} as const;

const dotColors = {
  open: "bg-open",
  in_progress: "bg-progress",
  done: "bg-done",
} as const;

export function statusLabel(status: WorkOrder["status"]): string {
  return status.replace("_", " ");
}

export function WorkOrderStatusBadge({
  status,
}: {
  status: WorkOrder["status"];
}) {
  return (
    <Badge variant={statusVariants[status]}>
      <span
        aria-hidden
        className={cn("size-2 rounded-full", dotColors[status])}
      />
      {statusLabel(status)}
    </Badge>
  );
}

export function PriorityBadge({
  priority,
}: {
  priority: WorkOrder["priority"];
}) {
  return (
    <Badge variant={priority === "high" ? "high" : "outline"}>
      {priority === "high" && (
        <span aria-hidden className="size-2 rounded-full bg-high" />
      )}
      {priority}
    </Badge>
  );
}
