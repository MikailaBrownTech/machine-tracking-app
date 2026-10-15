"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AssetFormState } from "@/app/assets/actions";
import { describedBy, Field, nativeSelectClass } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearFlash, setFlash } from "@/lib/flash";

type Initial = {
  name: string;
  type: string;
  location: string;
  serial: string;
  status: string;
};

const emptyInitial: Initial = {
  name: "",
  type: "",
  location: "",
  serial: "",
  status: "active",
};

const hints = {
  name: "What people call it on the floor.",
  type: "For example Lathe, Forklift or HVAC unit.",
  location: "Building, room or bay. Optional.",
  serial: "Must be unique. Optional.",
  status: "Retired assets are kept but cannot get new work orders.",
} as const;

export function AssetForm({
  action,
  initial = emptyInitial,
  submitLabel,
  successMessage,
  cancelHref,
}: {
  action: (prev: AssetFormState, formData: FormData) => Promise<AssetFormState>;
  initial?: Initial;
  submitLabel: string;
  successMessage: string;
  cancelHref: string;
}) {
  // A successful save redirects, so the toast is shown on the next page.
  // Returning from the action means it failed validation: drop the message.
  const [state, formAction, pending] = useActionState(
    async (prev: AssetFormState, formData: FormData) => {
      setFlash(successMessage);
      const next = await action(prev, formData);
      clearFlash();
      return next;
    },
    {},
  );
  const errors = state.errors ?? {};
  const v = (key: keyof Initial) => state.values?.[key] ?? initial[key];

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <Field label="Name" id="name" hint={hints.name} error={errors.name}>
        <Input
          id="name"
          name="name"
          defaultValue={v("name")}
          aria-invalid={!!errors.name}
          aria-describedby={describedBy("name", hints.name, errors.name)}
        />
      </Field>
      <Field label="Type" id="type" hint={hints.type} error={errors.type}>
        <Input
          id="type"
          name="type"
          defaultValue={v("type")}
          aria-invalid={!!errors.type}
          aria-describedby={describedBy("type", hints.type, errors.type)}
        />
      </Field>
      <Field
        label="Location"
        id="location"
        hint={hints.location}
        error={errors.location}
      >
        <Input
          id="location"
          name="location"
          defaultValue={v("location")}
          aria-invalid={!!errors.location}
          aria-describedby={describedBy(
            "location",
            hints.location,
            errors.location,
          )}
        />
      </Field>
      <Field
        label="Serial"
        id="serial"
        hint={hints.serial}
        error={errors.serial}
      >
        <Input
          id="serial"
          name="serial"
          defaultValue={v("serial")}
          className="font-mono"
          aria-invalid={!!errors.serial}
          aria-describedby={describedBy("serial", hints.serial, errors.serial)}
        />
      </Field>
      <Field
        label="Status"
        id="status"
        hint={hints.status}
        error={errors.status}
      >
        <select
          id="status"
          name="status"
          defaultValue={v("status")}
          className={nativeSelectClass}
          aria-invalid={!!errors.status}
          aria-describedby={describedBy("status", hints.status, errors.status)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="retired">Retired</option>
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
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
