"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      className="h-12 text-base print:hidden"
      onClick={() => window.print()}
    >
      Print
    </Button>
  );
}
