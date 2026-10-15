import { SignOutButton } from "@/components/sign-out-button";
import { requireUser } from "@/lib/session";

export default async function Home() {
  const user = await requireUser();
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Maintenance tracker</h1>
      <p className="text-base">
        Signed in as <strong>{user.email}</strong> ({user.role})
      </p>
      <SignOutButton />
    </main>
  );
}
