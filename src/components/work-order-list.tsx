import Link from "next/link";
import {
  PriorityBadge,
  WorkOrderStatusBadge,
} from "@/components/work-order-badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkOrder } from "@/db/queries/work-orders";
import { formatDateTime } from "@/lib/format";

export type WorkOrderRow = { workOrder: WorkOrder; assetName?: string };

// Cards below md, a table from md up. Only one is visible at a time.
export function WorkOrderList({ rows }: { rows: WorkOrderRow[] }) {
  const showAsset = rows.some((r) => r.assetName !== undefined);
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map(({ workOrder: wo, assetName }) => (
          <li key={wo.id}>
            <Link
              href={`/work-orders/${wo.id}`}
              className="flex min-h-tap flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
            >
              <span className="text-base font-semibold">{wo.title}</span>
              {assetName && (
                <span className="text-base text-muted-foreground">
                  {assetName}
                </span>
              )}
              <span className="flex flex-wrap items-center gap-2">
                <WorkOrderStatusBadge status={wo.status} />
                <PriorityBadge priority={wo.priority} />
              </span>
              <span className="text-sm text-muted-foreground">
                {formatDateTime(wo.createdAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-11 px-4 text-sm">Title</TableHead>
              {showAsset && (
                <TableHead className="h-11 px-4 text-sm">Asset</TableHead>
              )}
              <TableHead className="h-11 px-4 text-sm">Status</TableHead>
              <TableHead className="h-11 px-4 text-sm">Priority</TableHead>
              <TableHead className="h-11 px-4 text-sm">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ workOrder: wo, assetName }) => (
              <TableRow key={wo.id}>
                <TableCell className="px-4 py-3 text-base font-medium whitespace-normal">
                  <Link
                    href={`/work-orders/${wo.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {wo.title}
                  </Link>
                </TableCell>
                {showAsset && (
                  <TableCell className="px-4 py-3 text-base text-muted-foreground">
                    {assetName}
                  </TableCell>
                )}
                <TableCell className="px-4 py-3">
                  <WorkOrderStatusBadge status={wo.status} />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <PriorityBadge priority={wo.priority} />
                </TableCell>
                <TableCell className="px-4 py-3 text-sm whitespace-nowrap text-muted-foreground">
                  {formatDateTime(wo.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
