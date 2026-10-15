import { Suspense } from "react";
import { Page, PageHeader } from "@/components/page";
import { FormSkeleton } from "@/components/skeletons";
import { AssetForm } from "@/components/asset-form";
import { requireRole } from "@/lib/session";
import { createAsset } from "../actions";

async function NewAssetForm() {
  await requireRole("owner", "tech");
  return (
    <AssetForm
      action={createAsset}
      submitLabel="Create asset"
      successMessage="Asset created"
      cancelHref="/assets"
    />
  );
}

export default function NewAssetPage() {
  return (
    <Page narrow>
      <PageHeader title="New asset" />
      <Suspense fallback={<FormSkeleton />}>
        <NewAssetForm />
      </Suspense>
    </Page>
  );
}
