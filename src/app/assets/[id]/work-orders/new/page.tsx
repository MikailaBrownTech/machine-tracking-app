import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Page, PageHeader } from "@/components/page";
import { FormSkeleton } from "@/components/skeletons";
import { WorkOrderForm } from "@/components/work-order-form";
import { getAsset } from "@/db/queries/assets";
import { draftWorkOrder } from "@/app/work-orders/ai-actions";
import { env } from "@/env";
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
      <p className="text-base text-muted-foreground">
        For <span className="font-medium text-foreground">{asset.name}</span>
      </p>
      <WorkOrderForm
        action={createWorkOrder.bind(null, asset.id)}
        draftAction={
          env.ANTHROPIC_API_KEY
            ? draftWorkOrder.bind(null, asset.id)
            : undefined
        }
        cancelHref={`/assets/${asset.id}`}
      />
    </>
  );
}

export default function NewWorkOrderPage({
  params,
}: PageProps<"/assets/[id]/work-orders/new">) {
  return (
    <Page narrow>
      <PageHeader title="New work order" />
      <Suspense fallback={<FormSkeleton />}>
        <NewWorkOrder params={params} />
      </Suspense>
    </Page>
  );
}
