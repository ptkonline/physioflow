"use client";

import { DoctorShell } from "@/components/doctor/DoctorShell";
import { AuthGate } from "@/components/AuthGate";
import { ReminderWatcher } from "@/components/ReminderWatcher";
import type { ReactNode } from "react";

export default function DoctorAppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate role="physio">
      <ReminderWatcher />
      <DoctorShell>{children}</DoctorShell>
    </AuthGate>
  );
}
