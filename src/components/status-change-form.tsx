"use client";

import { useActionState } from "react";
import type { StatusChangeState } from "@/app/work-orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "open" | "in_progress" | "done";

export function StatusChangeForm({
  action,
  current,
  options,
}: {
  action: (
    prev: StatusChangeState,
    formData: FormData,
  ) => Promise<StatusChangeState>;
  current: Status;
  options: { value: Status; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="expectedFrom" value={current} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="note" className="text-base">
          Note (optional)
        </Label>
        <Input
          id="note"
          name="note"
          maxLength={500}
          className="h-12 text-base"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {options.map((o) => (
        <Button
          key={o.value}
          type="submit"
          name="toStatus"
          value={o.value}
          disabled={pending}
          className="h-12 text-base"
        >
          Move to {o.label}
        </Button>
      ))}
    </form>
  );
}
