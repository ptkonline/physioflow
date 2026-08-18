"use client";

import { BookingList } from "@/components/BookingList";
import { useCurrentUser } from "@/lib/store";
import Link from "next/link";

export default function PhysioBookings() {
  const { user } = useCurrentUser();
  if (!user) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">My bookings</h1>
          <p className="text-muted">Front desk bookings for your clinic ID land here automatically.</p>
        </div>
        <Link href="/physio/bookings/new" className="btn btn-primary">
          New booking
        </Link>
      </div>
      <BookingList physioId={user.id} />
    </div>
  );
}
