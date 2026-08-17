"use client";

import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { ReminderWatcher } from "@/components/ReminderWatcher";
import type { ReactNode } from "react";

export default function PhysioLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate role="physio">
      <ReminderWatcher />
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
