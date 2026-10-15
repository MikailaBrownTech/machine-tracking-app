import Link from "next/link";
import { Suspense } from "react";
import { AssetStatusBadge } from "@/components/asset-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { listAssets } from "@/db/queries/assets";
import { can, requireUser } from "@/lib/session";
import { cn } from "cn";

async function AssetList() {
  const user = await requireUser();
  const rows = await listAssets();
  return (
    <>
      {can(user.role, "write") && (
        <Link
          href="/assets/new"
          className={cn(buttonVariants(), "h-12 text-base")}
        >
          New asset
        </Link>
      )}
      {rows.length === 0 ? (
        <p className="text-base text-muted-foreground">No assets yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((a) => (
            <li key={a.id}>
              <Link
                href={`/assets/${a.id}`}
                className={cn(
                  "flex min-h-14 items-center justify-between gap-3 rounded-lg border p-3",
                  a.status === "retired" && "text-muted-foreground opacity-60",
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-base font-medium">
                    {a.name}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {[a.type, a.location].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <AssetStatusBadge status={a.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function AssetsPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Assets</h1>
      <Suspense fallback={<p className="text-base">Loading…</p>}>
        <AssetList />
      </Suspense>
    </main>
  );
}
