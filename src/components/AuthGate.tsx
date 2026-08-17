"use client";

import { useCurrentUser, useStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

export function AuthGate({
  role,
  children,
}: {
  role?: "patient" | "physio";
  children: ReactNode;
}) {
  const { user } = useCurrentUser();
  const { hydrated } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (role && user.role !== role) {
      router.replace(user.role === "physio" ? "/physio" : "/patient");
    }
  }, [hydrated, user, role, router, pathname]);

  if (!hydrated || !user) return null;
  if (role && user.role !== role) return null;
  return <>{children}</>;
}
