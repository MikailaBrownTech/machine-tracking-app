import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function Busy({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="flex flex-col gap-4"
    >
      {children}
    </div>
  );
}

export function StatTilesSkeleton() {
  return (
    <Busy>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="h-28 gap-3 px-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-9 w-12" />
          </Card>
        ))}
      </div>
    </Busy>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Busy>
      {Array.from({ length: rows }, (_, i) => (
        <Card key={i} className="gap-2 px-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </Card>
      ))}
    </Busy>
  );
}

export function DetailSkeleton() {
  return (
    <Busy>
      <Card className="gap-3 px-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-2/3" />
      </Card>
      <Card className="items-center px-4">
        <Skeleton className="size-48" />
      </Card>
      <ListSkeleton rows={2} />
    </Busy>
  );
}

export function WorkOrderSkeleton() {
  return (
    <Busy>
      <Card className="gap-3 px-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
      </Card>
      <Card className="px-4">
        <Skeleton className="h-16 w-full" />
      </Card>
      <Skeleton className="h-14 w-full" />
      <Card className="gap-4 px-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-6 w-2/3" />
      </Card>
    </Busy>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Busy>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-12 w-full" />
    </Busy>
  );
}
