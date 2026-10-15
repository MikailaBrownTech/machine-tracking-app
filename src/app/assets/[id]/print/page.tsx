import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PrintButton } from "@/components/print-button";
import { getAsset } from "@/db/queries/assets";
import { assetQrDataUrl } from "@/lib/qr";
import { requireRole } from "@/lib/session";

async function PrintSheet({
  params,
}: Pick<PageProps<"/assets/[id]/print">, "params">) {
  await requireRole("owner", "tech");
  const { id } = await params;
  const asset = await getAsset(id);
  if (!asset) notFound();
  const qr = await assetQrDataUrl(asset.id);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qr}
        alt={`QR code linking to ${asset.name}`}
        width={384}
        height={384}
        className="aspect-square w-full max-w-sm"
      />
      <h1 className="text-3xl font-bold">{asset.name}</h1>
      <p className="text-xl">{asset.location || "—"}</p>
      <p className="font-mono text-xl">{asset.serial ?? "No serial"}</p>
      <PrintButton />
    </>
  );
}

export default function PrintPage({ params }: PageProps<"/assets/[id]/print">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-6 text-center">
      <Suspense fallback={<p className="text-base">Loading…</p>}>
        <PrintSheet params={params} />
      </Suspense>
    </main>
  );
}
