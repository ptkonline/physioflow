"use client";

import { DoctorDirectory } from "@/components/DoctorDirectory";
import { DoctorForm } from "@/components/DoctorForm";

export default function PhysioDoctors() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Clinic doctors</h1>
        <p className="text-muted">Add a colleague with their own login and clinic ID.</p>
      </header>
      <DoctorForm />
      <DoctorDirectory />
    </div>
  );
}
