"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const signInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(1, "Enter your name"),
  password: z.string().min(8, "Use at least 8 characters").max(128),
});

type Mode = "sign-in" | "sign-up";
type FieldErrors = Partial<Record<"name" | "email" | "password", string>>;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isSignUp = mode === "sign-up";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const raw = Object.fromEntries(new FormData(e.currentTarget));
    const schema = isSignUp ? signUpSchema : signInSchema;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const flat: Record<string, string[] | undefined> = z.flattenError(
        parsed.error,
      ).fieldErrors;
      setErrors({
        name: flat.name?.[0],
        email: flat.email?.[0],
        password: flat.password?.[0],
      });
      return;
    }
    setErrors({});
    setPending(true);
    const { email, password } = parsed.data;
    const result = isSignUp
      ? await authClient.signUp.email({
          name: signUpSchema.parse(raw).name,
          email,
          password,
        })
      : await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      setFormError(result.error.message ?? "Something went wrong");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {isSignUp && (
        <Field label="Name" id="name" error={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            className="h-12 text-base"
            aria-invalid={!!errors.name}
          />
        </Field>
      )}
      <Field label="Email" id="email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="h-12 text-base"
          aria-invalid={!!errors.email}
        />
      </Field>
      <Field label="Password" id="password" error={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className="h-12 text-base"
          aria-invalid={!!errors.password}
        />
      </Field>
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-12 text-base">
        {isSignUp ? "Create account" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account? " : "No account yet? "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {isSignUp ? "Sign in" : "Sign up"}
        </Link>
      </p>
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
