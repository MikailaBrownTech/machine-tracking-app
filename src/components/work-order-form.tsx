"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { WorkOrderFormState } from "@/app/work-orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.errors ?? {};
  const v = (key: string, fallback = "") => state.values?.[key] ?? fallback;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title" className="text-base">
          Title
        </Label>
        <Input
          id="title"
          name="title"
          defaultValue={v("title")}
          className="h-12 text-base"
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description" className="text-base">
          Description
        </Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={v("description")}
          className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-base"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="priority" className="text-base">
          Priority
        </Label>
        <select
          id="priority"
          name="priority"
          defaultValue={v("priority", "medium")}
          className="h-12 w-full rounded-lg border border-input bg-background px-2.5 text-base"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {errors.priority && (
          <p className="text-sm text-destructive">{errors.priority}</p>
        )}
      </div>
      {errors.form && (
        <p role="alert" className="text-sm text-destructive">
          {errors.form}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-12 text-base">
        Create work order
      </Button>
      <Link
        href={cancelHref}
        className="flex h-12 items-center justify-center text-base underline underline-offset-4"
      >
        Cancel
      </Link>
    </form>
  );
}
