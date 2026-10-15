import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AssetStatusBadge } from "@/components/asset-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { getAsset } from "@/db/queries/assets";
import {
  PriorityBadge,
  WorkOrderStatusBadge,
} from "@/components/work-order-badges";
import { listWorkOrdersForAsset } from "@/db/queries/work-orders";
import { formatDateTime } from "@/lib/format";
import { assetQrDataUrl } from "@/lib/qr";
import { can, requireUser } from "@/lib/session";
import { cn } from "cn";
import { setAssetStatus } from "../actions";

async function AssetDetails({
  params,
}: Pick<PageProps<"/assets/[id]">, "params">) {
  const user = await requireUser();
  const { id } = await params;
  const asset = await getAsset(id);
  if (!asset) notFound();
  const [qr, workOrders] = await Promise.all([
    assetQrDataUrl(asset.id),
    listWorkOrdersForAsset(asset.id),
  ]);
  const writer = can(user.role, "write");
  const retired = asset.status === "retired";
  const toggle = setAssetStatus.bind(
    null,
    asset.id,
    retired ? "active" : "retired",
  );

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">{asset.name}</h1>
        <AssetStatusBadge status={asset.status} />
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-base">
        <dt className="text-muted-foreground">Type</dt>
        <dd>{asset.type}</dd>
        <dt className="text-muted-foreground">Location</dt>
        <dd>{asset.location || "—"}</dd>
        <dt className="text-muted-foreground">Serial</dt>
        <dd>{asset.serial ?? "—"}</dd>
      </dl>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qr}
        alt={`QR code linking to ${asset.name}`}
        width={192}
        height={192}
        className="size-48"
      />
      {writer && (
        <div className="flex flex-col gap-2">
          <Link
            href={`/assets/${asset.id}/edit`}
            className={cn(buttonVariants(), "h-12 text-base")}
          >
            Edit
          </Link>
          <Link
            href={`/assets/${asset.id}/print`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 text-base",
            )}
          >
            Print QR
          </Link>
          <form action={toggle}>
            <Button
              type="submit"
              variant="outline"
              className="h-12 w-full text-base"
            >
              {retired ? "Reactivate" : "Retire"}
            </Button>
          </form>
        </div>
      )}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Work orders</h2>
        {writer && !retired && (
          <Link
            href={`/assets/${asset.id}/work-orders/new`}
            className={cn(buttonVariants(), "h-12 text-base")}
          >
            New work order
          </Link>
        )}
        {workOrders.length === 0 ? (
          <p className="text-base text-muted-foreground">No work orders yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {workOrders.map((wo) => (
              <li key={wo.id}>
                <Link
                  href={`/work-orders/${wo.id}`}
                  className="flex min-h-11 flex-col gap-1 rounded-lg border p-3 text-base"
                >
                  <span className="font-medium">{wo.title}</span>
                  <span className="flex flex-wrap items-center gap-2">
                    <WorkOrderStatusBadge status={wo.status} />
                    <PriorityBadge priority={wo.priority} />
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(wo.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default function AssetPage({ params }: PageProps<"/assets/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6">
      <Suspense fallback={<p className="text-base">Loading…</p>}>
        <AssetDetails params={params} />
      </Suspense>
    </main>
  );
}
