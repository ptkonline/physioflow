"use client";

import { BookingList } from "@/components/BookingList";
import { useCurrentUser } from "@/lib/store";
import Link from "next/link";

export default function PhysioBookings() {
  const { user } = useCurrentUser();
  if (!user) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold">Appointments</h1>
        <p className="text-muted">
          When a patient books you, their name, time, and visit details appear here immediately. No one has to assign the booking.
        </p>
      </div>
      <BookingList physioId={user.id} />
      <Link href="/physio/availability" className="btn btn-ghost">
        Edit clinic hours
      </Link>
    </div>
  );
}
