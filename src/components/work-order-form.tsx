"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { WorkOrderFormState } from "@/app/work-orders/actions";
import { describedBy, Field, nativeSelectClass } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clearFlash, setFlash } from "@/lib/flash";

const hints = {
  title: "A short summary, like “Replace spindle belt”.",
  description: "What is wrong and what needs doing. Optional.",
  priority: "High priority work shows on the dashboard until started.",
} as const;

export function WorkOrderForm({
  action,
  cancelHref,
}: {
  action: (
    prev: WorkOrderFormState,
    formData: FormData,
  ) => Promise<WorkOrderFormState>;
  cancelHref: string;
}) {
  // A successful create redirects, so the toast is shown on the next page.
  const [state, formAction, pending] = useActionState(
    async (prev: WorkOrderFormState, formData: FormData) => {
      setFlash("Work order created");
      const next = await action(prev, formData);
      clearFlash();
      return next;
    },
    {},
  );
  const errors = state.errors ?? {};
  const v = (key: string, fallback = "") => state.values?.[key] ?? fallback;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <Field label="Title" id="title" hint={hints.title} error={errors.title}>
        <Input
          id="title"
          name="title"
          defaultValue={v("title")}
          aria-invalid={!!errors.title}
          aria-describedby={describedBy("title", hints.title, errors.title)}
        />
      </Field>
      <Field
        label="Description"
        id="description"
        hint={hints.description}
        error={errors.description}
      >
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={v("description")}
          aria-invalid={!!errors.description}
          aria-describedby={describedBy(
            "description",
            hints.description,
            errors.description,
          )}
        />
      </Field>
      <Field
        label="Priority"
        id="priority"
        hint={hints.priority}
        error={errors.priority}
      >
        <select
          id="priority"
          name="priority"
          defaultValue={v("priority", "medium")}
          className={nativeSelectClass}
          aria-invalid={!!errors.priority}
          aria-describedby={describedBy(
            "priority",
            hints.priority,
            errors.priority,
          )}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </Field>
      {errors.form && (
        <p role="alert" className="text-base font-medium text-destructive">
          {errors.form}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          Cancel
        </Link>
        <SubmitButton pending={pending}>Create work order</SubmitButton>
      </div>
    </form>
  );
}
