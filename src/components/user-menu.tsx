"use client";

import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export function UserMenuClient({
  email,
  role,
}: {
  email: string;
  role: string;
}) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="User menu"
        className="flex h-tap min-w-tap items-center justify-center gap-2 rounded-lg border bg-card px-3 text-base font-medium hover:bg-muted"
      >
        <User className="size-5" aria-hidden />
        <span className="hidden max-w-48 truncate lg:inline">{email}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <div className="flex flex-col gap-2 px-2 py-2">
          <span className="truncate text-base font-medium">{email}</span>
          <Badge variant="secondary" className="self-start">
            {role}
          </Badge>
        </div>
        <DropdownMenuItem
          className="min-h-tap text-base"
          onClick={async () => {
            await authClient.signOut();
            router.push("/sign-in");
            router.refresh();
          }}
        >
          <LogOut className="size-5" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
