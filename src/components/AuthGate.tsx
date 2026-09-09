"use client";

import { homePath } from "@/lib/paths";
import { useCurrentUser, useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function AuthGate({
  role,
  children,
}: {
  role?: Role;
  children: ReactNode;
}) {
  const { user } = useCurrentUser();
  const { hydrated } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      const roleHint = role === "physio" ? "doctor" : role === "patient" ? "patient" : "";
      const next = encodeURIComponent(pathname);
      const qs = roleHint ? `next=${next}&role=${roleHint}` : `next=${next}`;
      router.replace(`/login?${qs}`);
      return;
    }
    if (role && user.role !== role) {
      router.replace(homePath(user.role));
    }
  }, [hydrated, user, role, router, pathname]);

  if (!hydrated || !user) return null;
  if (role && user.role !== role) return null;
  return <>{children}</>;
}
