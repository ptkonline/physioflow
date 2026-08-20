"use client";

import { PatientShell } from "@/components/patient/PatientShell";
import { AuthGate } from "@/components/AuthGate";
import { ReminderWatcher } from "@/components/ReminderWatcher";
import type { ReactNode } from "react";

export default function PatientAppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate role="patient">
      <ReminderWatcher />
      <PatientShell>{children}</PatientShell>
    </AuthGate>
  );
}
