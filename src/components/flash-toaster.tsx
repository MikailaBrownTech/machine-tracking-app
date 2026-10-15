"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { takeFlash } from "@/lib/flash";

function Flash() {
  const pathname = usePathname();
  useEffect(() => {
    const message = takeFlash();
    if (message) toast.success(message);
  }, [pathname]);
  return null;
}

export function FlashToaster() {
  return (
    <Suspense fallback={null}>
      <Flash />
    </Suspense>
  );
}
