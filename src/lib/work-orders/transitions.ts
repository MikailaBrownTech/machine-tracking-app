export type WorkOrderStatus = "open" | "in_progress" | "done";

// Forward-only. The single source of truth for status rules.
const transitions: Record<WorkOrderStatus, readonly WorkOrderStatus[]> = {
  open: ["in_progress"],
  in_progress: ["done"],
  done: [],
};

export function canTransition(
  from: WorkOrderStatus,
  to: WorkOrderStatus,
): boolean {
  return transitions[from].includes(to);
}

export function nextStatuses(from: WorkOrderStatus): WorkOrderStatus[] {
  return [...transitions[from]];
}

export const workOrderStatuses = Object.keys(
  transitions,
) as WorkOrderStatus[];
