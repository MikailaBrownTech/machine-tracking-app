import { Badge } from "@/components/ui/badge";
import type { Asset } from "@/db/queries/assets";

const variants = {
  active: "default",
  inactive: "secondary",
  retired: "outline",
} as const;

export function AssetStatusBadge({ status }: { status: Asset["status"] }) {
  return <Badge variant={variants[status]}>{status}</Badge>;
}
