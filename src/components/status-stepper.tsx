import { Check } from "lucide-react";
import { statusLabel } from "@/components/work-order-badges";
import {
  workOrderStatuses,
  type WorkOrderStatus,
} from "@/lib/work-orders/transitions";
import { cn } from "@/lib/utils";

const solid: Record<WorkOrderStatus, string> = {
  open: "bg-open text-primary-foreground",
  in_progress: "bg-progress text-white",
  done: "bg-done text-primary-foreground",
};

const ring: Record<WorkOrderStatus, string> = {
  open: "ring-open/40",
  in_progress: "ring-progress/40",
  done: "ring-done/40",
};

export function StatusStepper({ current }: { current: WorkOrderStatus }) {
  const currentIndex = workOrderStatuses.indexOf(current);
  return (
    <ol
      aria-label="Progress"
      className="grid grid-cols-3 rounded-xl border bg-card px-2 py-4"
    >
      {workOrderStatuses.map((status, i) => {
        const reached = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li
            key={status}
            aria-current={isCurrent ? "step" : undefined}
            className="relative flex flex-col items-center gap-2 text-center"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-4 right-1/2 h-1 w-full -translate-y-1/2 rounded-full",
                  i <= currentIndex ? "bg-foreground/70" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-8 items-center justify-center rounded-full text-sm font-bold",
                reached
                  ? solid[status]
                  : "border-2 border-input bg-card text-muted-foreground",
                isCurrent && cn("ring-4", ring[status]),
              )}
            >
              {i < currentIndex || current === "done" ? (
                <Check className="size-5" aria-hidden />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={cn(
                "text-sm capitalize",
                isCurrent ? "font-bold" : "text-muted-foreground",
              )}
            >
              {statusLabel(status)}
              {isCurrent && <span className="sr-only"> (current)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
