"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import type { StatusChangeState } from "@/app/work-orders/actions";
import { Field } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";

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
  const [state, formAction, pending] = useActionState(
    async (prev: StatusChangeState, formData: FormData) => {
      const next = await action(prev, formData);
      if (!next.error) {
        const to = options.find((o) => o.value === formData.get("toStatus"));
        toast.success(to ? `Moved to ${to.label}` : "Status updated");
      }
      return next;
    },
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="expectedFrom" value={current} />
      <Field
        label="Note (optional)"
        id="note"
        hint="Shown in the history. Up to 500 characters."
      >
        <Input id="note" name="note" maxLength={500} />
      </Field>
      {state.error && (
        <p role="alert" className="text-base font-medium text-destructive">
          {state.error}
        </p>
      )}
      {options.map((o, i) => (
        <SubmitButton
          key={o.value}
          name="toStatus"
          value={o.value}
          pending={pending}
          variant={i === 0 ? "default" : "outline"}
          className="h-14 text-lg font-semibold"
        >
          Move to {o.label}
        </SubmitButton>
      ))}
    </form>
  );
}
