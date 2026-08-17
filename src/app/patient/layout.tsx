"use client";

import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { ReminderWatcher } from "@/components/ReminderWatcher";
import type { ReactNode } from "react";

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate role="patient">
      <ReminderWatcher />
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
