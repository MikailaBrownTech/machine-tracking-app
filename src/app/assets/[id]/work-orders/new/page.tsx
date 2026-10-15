import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { WorkOrderForm } from "@/components/work-order-form";
import { getAsset } from "@/db/queries/assets";
import { requireRole } from "@/lib/session";
import { createWorkOrder } from "@/app/work-orders/actions";

async function NewWorkOrder({
  params,
}: Pick<PageProps<"/assets/[id]/work-orders/new">, "params">) {
  await requireRole("owner", "tech");
  const { id } = await params;
  const asset = await getAsset(id);
  if (!asset) notFound();
  if (asset.status === "retired") redirect(`/assets/${asset.id}`);
  return (
    <>
      <p className="text-base text-muted-foreground">{asset.name}</p>
      <WorkOrderForm
        action={createWorkOrder.bind(null, asset.id)}
        cancelHref={`/assets/${asset.id}`}
      />
    </>
  );
}

export default function NewWorkOrderPage({
  params,
}: PageProps<"/assets/[id]/work-orders/new">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">New work order</h1>
      <Suspense fallback={<p className="text-base">Loading…</p>}>
        <NewWorkOrder params={params} />
      </Suspense>
    </main>
  );
}
