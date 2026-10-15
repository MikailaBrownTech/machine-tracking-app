import { Suspense } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { requireUser } from "@/lib/session";

async function SignedInAs() {
  const user = await requireUser();
  return (
    <p className="text-base">
      Signed in as <strong>{user.email}</strong> ({user.role})
    </p>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Maintenance tracker</h1>
      <Suspense fallback={<p className="text-base">&nbsp;</p>}>
        <SignedInAs />
      </Suspense>
      <SignOutButton />
    </main>
  );
}
