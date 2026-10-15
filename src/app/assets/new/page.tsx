import { Suspense } from "react";
import { AssetForm } from "@/components/asset-form";
import { requireRole } from "@/lib/session";
import { createAsset } from "../actions";

async function NewAssetForm() {
  await requireRole("owner", "tech");
  return (
    <AssetForm
      action={createAsset}
      submitLabel="Create asset"
      cancelHref="/assets"
    />
  );
}

export default function NewAssetPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">New asset</h1>
      <Suspense fallback={<p className="text-base">Loading…</p>}>
        <NewAssetForm />
      </Suspense>
    </main>
  );
}
