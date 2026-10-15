import { Plus, Wrench } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AssetList } from "@/components/asset-list";
import { EmptyState } from "@/components/empty-state";
import { Page, PageHeader } from "@/components/page";
import { ListSkeleton } from "@/components/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { listAssets } from "@/db/queries/assets";
import { can, requireUser } from "@/lib/session";

async function Assets() {
  const user = await requireUser();
  const rows = await listAssets();
  const writer = can(user.role, "write");
  const newLink = (
    <Link href="/assets/new" className={buttonVariants({ size: "lg" })}>
      <Plus aria-hidden />
      New asset
    </Link>
  );
  return (
    <>
      <PageHeader
        title="Assets"
        description={rows.length > 0 ? `${rows.length} tracked` : undefined}
        actions={writer && rows.length > 0 ? newLink : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No assets yet"
          description={
            writer
              ? "Add your first machine or piece of equipment to start tracking work."
              : "Assets will show up here once an owner or tech adds them."
          }
          action={writer ? newLink : undefined}
        />
      ) : (
        <AssetList rows={rows} />
      )}
    </>
  );
}

export default function AssetsPage() {
  return (
    <Page>
      <Suspense
        fallback={
          <>
            <PageHeader title="Assets" />
            <ListSkeleton />
          </>
        }
      >
        <Assets />
      </Suspense>
    </Page>
  );
}
