import { Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-8">
      <div className="flex flex-col items-center gap-3">
        <span
          aria-hidden
          className="flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
          <Wrench className="size-8" />
        </span>
        <p className="text-xl font-bold tracking-tight">Maintenance</p>
      </div>
      <Card className="gap-5 px-5 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-base text-muted-foreground">{description}</p>
        </div>
        {children}
      </Card>
    </main>
  );
}
