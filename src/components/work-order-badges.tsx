import { Badge } from "@/components/ui/badge";
import type { WorkOrder } from "@/db/queries/work-orders";

const statusVariants = {
  open: "default",
  in_progress: "secondary",
  done: "outline",
} as const;

export function statusLabel(status: WorkOrder["status"]): string {
  return status.replace("_", " ");
}

export function WorkOrderStatusBadge({
  status,
}: {
  status: WorkOrder["status"];
}) {
  return <Badge variant={statusVariants[status]}>{statusLabel(status)}</Badge>;
}

export function PriorityBadge({
  priority,
}: {
  priority: WorkOrder["priority"];
}) {
  return (
    <Badge variant={priority === "high" ? "default" : "outline"}>
      {priority}
    </Badge>
  );
}
