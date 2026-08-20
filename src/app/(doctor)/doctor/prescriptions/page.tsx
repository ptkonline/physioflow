"use client";

import { PrescriptionsPage } from "@/components/shared/PrescriptionsPage";
import { Suspense } from "react";

export default function DoctorPrescriptions() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <PrescriptionsPage portal="doctor" />
    </Suspense>
  );
}
