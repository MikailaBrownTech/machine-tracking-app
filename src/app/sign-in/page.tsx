import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { RedirectIfSignedIn } from "@/components/redirect-if-signed-in";

export default function SignInPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-8">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <AuthForm mode="sign-in" />
    </main>
  );
}
