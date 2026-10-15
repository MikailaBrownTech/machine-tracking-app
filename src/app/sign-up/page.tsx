import { Suspense } from "react";
import { AuthCard } from "@/components/auth-card";
import { AuthForm } from "@/components/auth-form";
import { RedirectIfSignedIn } from "@/components/redirect-if-signed-in";

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create account"
      description="New accounts can view everything. An owner promotes you to edit."
    >
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <AuthForm mode="sign-up" />
    </AuthCard>
  );
}
