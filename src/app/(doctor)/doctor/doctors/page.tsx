"use client";

import { DoctorDirectory } from "@/components/DoctorDirectory";

export default function PhysioDoctors() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Doctors on the platform</h1>
        <p className="text-muted">Colleagues appear here when they create their own profile. There is no admin step.</p>
      </header>
      <DoctorDirectory />
    </div>
  );
}
