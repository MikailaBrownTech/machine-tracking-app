import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { RedirectIfSignedIn } from "@/components/redirect-if-signed-in";

export default function SignInPage() {
  return (
    <AuthCard title="Sign in" description="Welcome back. Sign in to continue.">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <AuthForm mode="sign-in" />
    </AuthCard>
  );
}
