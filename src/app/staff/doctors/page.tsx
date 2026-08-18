"use client";

import { DoctorDirectory } from "@/components/DoctorDirectory";
import { DoctorForm } from "@/components/DoctorForm";

export default function StaffDoctors() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Doctors</h1>
        <p className="text-muted">
          Each doctor has a clinic ID. Bookings made for them appear on their account without extra linking.
        </p>
      </header>
      <DoctorForm />
      <DoctorDirectory />
    </div>
  );
}
