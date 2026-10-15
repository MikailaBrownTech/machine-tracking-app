import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Page } from "@/components/page";
import { PrintButton } from "@/components/print-button";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
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
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`/assets/${asset.id}`}
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeft aria-hidden />
          Back
        </Link>
        <PrintButton />
      </div>
      <section className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed bg-white p-6 text-center text-black print:break-inside-avoid print:rounded-none print:border-2 print:border-solid print:border-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qr}
          alt={`QR code linking to ${asset.name}`}
          width={384}
          height={384}
          className="aspect-square w-full max-w-sm"
        />
        <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
        <p className="text-xl">{asset.location || "—"}</p>
        <p className="font-mono text-xl">{asset.serial ?? "No serial"}</p>
        <p className="text-base text-neutral-600 print:text-black">
          Scan to open this asset
        </p>
      </section>
    </>
  );
}

export default function PrintPage({ params }: PageProps<"/assets/[id]/print">) {
  return (
    <Page narrow className="print:max-w-none print:p-0">
      <Suspense
        fallback={
          <div role="status" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <PrintSheet params={params} />
      </Suspense>
    </Page>
  );
}
