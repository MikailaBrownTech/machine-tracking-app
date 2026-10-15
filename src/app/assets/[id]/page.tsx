import { ClipboardList, Pencil, Plus, Printer, QrCode } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AssetStatusBadge } from "@/components/asset-status-badge";
import { EmptyState } from "@/components/empty-state";
import { Page } from "@/components/page";
import { DetailSkeleton } from "@/components/skeletons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WorkOrderList } from "@/components/work-order-list";
import { getAsset } from "@/db/queries/assets";
import { listWorkOrdersForAsset } from "@/db/queries/work-orders";
import { assetQrDataUrl } from "@/lib/qr";
import { can, requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
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
  const canCreate = writer && !retired;
  const toggle = setAssetStatus.bind(
    null,
    asset.id,
    retired ? "active" : "retired",
  );
  // One link: pinned above the tab bar on mobile, inline from md up.
  const newWorkOrder = (
    <Link
      href={`/assets/${asset.id}/work-orders/new`}
      className={cn(
        buttonVariants({ size: "lg" }),
        "fixed inset-x-4 bottom-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom)+0.75rem)] z-30 shadow-lg md:static md:inset-auto md:shadow-none",
      )}
    >
      <Plus aria-hidden />
      New work order
    </Link>
  );

  return (
    <div
      className={cn(
        "grid gap-6 md:grid-cols-[1fr_18rem] md:items-start",
        canCreate && "pb-20 md:pb-0",
      )}
    >
      <Card className={cn("gap-4 px-4 md:px-6", retired && "bg-muted")}>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {asset.name}
          </h1>
          <AssetStatusBadge status={asset.status} />
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-base">
          <dt className="text-muted-foreground">Type</dt>
          <dd>{asset.type}</dd>
          <dt className="text-muted-foreground">Location</dt>
          <dd>{asset.location || "—"}</dd>
          <dt className="text-muted-foreground">Serial</dt>
          <dd className="font-mono">{asset.serial ?? "—"}</dd>
        </dl>
        {writer && (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Link
              href={`/assets/${asset.id}/edit`}
              className={buttonVariants({ variant: "outline" })}
            >
              <Pencil aria-hidden />
              Edit
            </Link>
            <form action={toggle}>
              <Button type="submit" variant="outline">
                {retired ? "Reactivate" : "Retire"}
              </Button>
            </form>
          </div>
        )}
      </Card>

      <Card className="items-center gap-3 px-4 md:col-start-2 md:row-span-2 md:row-start-1">
        <div className="flex items-center gap-2 text-base font-semibold">
          <QrCode className="size-5" aria-hidden />
          QR label
        </div>
        {/* White tile keeps the code scannable in dark mode. */}
        <div className="rounded-lg bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt={`QR code linking to ${asset.name}`}
            width={192}
            height={192}
            className="size-48"
          />
        </div>
        {writer && (
          <Link
            href={`/assets/${asset.id}/print`}
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            <Printer aria-hidden />
            Print QR
          </Link>
        )}
      </Card>

      <section className="flex flex-col gap-3 md:col-start-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Work orders</h2>
          {canCreate && newWorkOrder}
        </div>
        {workOrders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No work orders yet"
            description={
              canCreate
                ? "Log the first repair or inspection for this asset."
                : "Nothing has been logged for this asset."
            }
          />
        ) : (
          <WorkOrderList
            rows={workOrders.map((workOrder) => ({ workOrder }))}
          />
        )}
      </section>
    </div>
  );
}

export default function AssetPage({ params }: PageProps<"/assets/[id]">) {
  return (
    <Page>
      <Suspense fallback={<DetailSkeleton />}>
        <AssetDetails params={params} />
      </Suspense>
    </Page>
  );
}
