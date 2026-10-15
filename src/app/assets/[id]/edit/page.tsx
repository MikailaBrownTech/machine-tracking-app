import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Page, PageHeader } from "@/components/page";
import { FormSkeleton } from "@/components/skeletons";
import { AssetForm } from "@/components/asset-form";
import { getAsset } from "@/db/queries/assets";
import { requireRole } from "@/lib/session";
import { updateAsset } from "../../actions";

async function EditAssetForm({
  params,
}: Pick<PageProps<"/assets/[id]/edit">, "params">) {
  await requireRole("owner", "tech");
  const { id } = await params;
  const asset = await getAsset(id);
  if (!asset) notFound();
  return (
    <AssetForm
      action={updateAsset.bind(null, id)}
      initial={{
        name: asset.name,
        type: asset.type,
        location: asset.location,
        serial: asset.serial ?? "",
        status: asset.status,
      }}
      submitLabel="Save changes"
      successMessage="Asset saved"
      cancelHref={`/assets/${id}`}
    />
  );
}

export default function EditAssetPage({
  params,
}: PageProps<"/assets/[id]/edit">) {
  return (
    <Page narrow>
      <PageHeader title="Edit asset" />
      <Suspense fallback={<FormSkeleton />}>
        <EditAssetForm params={params} />
      </Suspense>
    </Page>
  );
}
