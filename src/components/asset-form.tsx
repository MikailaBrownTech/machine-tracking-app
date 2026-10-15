"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AssetFormState } from "@/app/assets/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export function AssetForm({
  action,
  initial = emptyInitial,
  submitLabel,
  cancelHref,
}: {
  action: (prev: AssetFormState, formData: FormData) => Promise<AssetFormState>;
  initial?: Initial;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.errors ?? {};
  const v = (key: keyof Initial) => state.values?.[key] ?? initial[key];

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <Field label="Name" id="name" error={errors.name}>
        <Input
          id="name"
          name="name"
          defaultValue={v("name")}
          className="h-12 text-base"
          aria-invalid={!!errors.name}
        />
      </Field>
      <Field label="Type" id="type" error={errors.type}>
        <Input
          id="type"
          name="type"
          defaultValue={v("type")}
          className="h-12 text-base"
          aria-invalid={!!errors.type}
        />
      </Field>
      <Field label="Location" id="location" error={errors.location}>
        <Input
          id="location"
          name="location"
          defaultValue={v("location")}
          className="h-12 text-base"
          aria-invalid={!!errors.location}
        />
      </Field>
      <Field label="Serial" id="serial" error={errors.serial}>
        <Input
          id="serial"
          name="serial"
          defaultValue={v("serial")}
          className="h-12 text-base"
          aria-invalid={!!errors.serial}
        />
      </Field>
      <Field label="Status" id="status" error={errors.status}>
        <select
          id="status"
          name="status"
          defaultValue={v("status")}
          className="h-12 w-full rounded-lg border border-input bg-background px-2.5 text-base"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="retired">Retired</option>
        </select>
      </Field>
      {errors.form && (
        <p role="alert" className="text-sm text-destructive">
          {errors.form}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-12 text-base">
        {submitLabel}
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

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-base">
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
