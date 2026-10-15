import { notFound } from "next/navigation";
import { Suspense } from "react";
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
      cancelHref={`/assets/${id}`}
    />
  );
}

export default function EditAssetPage({
  params,
}: PageProps<"/assets/[id]/edit">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Edit asset</h1>
      <Suspense fallback={<p className="text-base">Loading…</p>}>
        <EditAssetForm params={params} />
      </Suspense>
    </main>
  );
}
