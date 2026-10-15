import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { Page, PageHeader } from "@/components/page";
import { ListSkeleton } from "@/components/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { WorkOrderList } from "@/components/work-order-list";
import { listOpenWorkOrders } from "@/db/queries/work-orders";
import { can, requireUser } from "@/lib/session";

async function OpenWorkOrders() {
  const user = await requireUser();
  const rows = await listOpenWorkOrders();
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No open work orders"
        description={
          can(user.role, "write")
            ? "Open an asset and create a work order to get started."
            : "Everything is up to date."
        }
        action={
          <Link
            href="/assets"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Go to assets
          </Link>
        }
      />
    );
  }
  return <WorkOrderList rows={rows} />;
}

export default function WorkOrdersPage() {
  return (
    <Page>
      <PageHeader
        title="Work orders"
        description="Open and in progress, newest first"
      />
      <Suspense fallback={<ListSkeleton />}>
        <OpenWorkOrders />
      </Suspense>
    </Page>
  );
}
