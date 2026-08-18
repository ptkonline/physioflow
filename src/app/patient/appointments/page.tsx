"use client";

import { BookingList } from "@/components/BookingList";
import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";

export default function PatientAppointments() {
  const { user } = useCurrentUser();
  const { state } = useStore();
  if (!user) return null;
  const mine = (state.bookings ?? []).filter((b) => b.patientId === user.id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">My appointments</h1>
          <p className="text-muted">{mine.length} booking{mine.length === 1 ? "" : "s"} on your record.</p>
        </div>
        <Link href="/patient/doctors" className="btn btn-primary">
          Book a doctor
        </Link>
      </div>
      <BookingList patientId={user.id} />
    </div>
  );
}
