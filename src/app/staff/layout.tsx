"use client";

import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import type { ReactNode } from "react";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate role="staff">
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
