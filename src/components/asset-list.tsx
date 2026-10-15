import Link from "next/link";
import { AssetStatusBadge } from "@/components/asset-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Asset } from "@/db/queries/assets";
import { cn } from "@/lib/utils";

// Cards below md, a table from md up. Retired assets are muted.
export function AssetList({ rows }: { rows: Asset[] }) {
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((a) => (
          <li key={a.id}>
            <Link
              href={`/assets/${a.id}`}
              className={cn(
                "flex min-h-tap items-center justify-between gap-3 rounded-xl border p-4 transition-colors hover:bg-muted",
                a.status === "retired"
                  ? "bg-muted text-muted-foreground"
                  : "bg-card",
              )}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-base font-semibold">
                  {a.name}
                </span>
                <span className="truncate text-base text-muted-foreground">
                  {[a.type, a.location].filter(Boolean).join(" · ")}
                </span>
                {a.serial && (
                  <span className="truncate font-mono text-sm text-muted-foreground">
                    {a.serial}
                  </span>
                )}
              </span>
              <AssetStatusBadge status={a.status} />
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-11 px-4 text-sm">Name</TableHead>
              <TableHead className="h-11 px-4 text-sm">Type</TableHead>
              <TableHead className="h-11 px-4 text-sm">Location</TableHead>
              <TableHead className="h-11 px-4 text-sm">Serial</TableHead>
              <TableHead className="h-11 px-4 text-sm">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow
                key={a.id}
                className={cn(a.status === "retired" && "bg-muted")}
              >
                <TableCell className="px-4 py-3 text-base font-medium">
                  <Link
                    href={`/assets/${a.id}`}
                    className={cn(
                      "underline-offset-4 hover:underline",
                      a.status === "retired" && "text-muted-foreground",
                    )}
                  >
                    {a.name}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3 text-base text-muted-foreground">
                  {a.type}
                </TableCell>
                <TableCell className="px-4 py-3 text-base text-muted-foreground">
                  {a.location || "—"}
                </TableCell>
                <TableCell className="px-4 py-3 font-mono text-sm text-muted-foreground">
                  {a.serial ?? "—"}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <AssetStatusBadge status={a.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
