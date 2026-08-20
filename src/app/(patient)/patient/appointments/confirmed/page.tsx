"use client";

import { formatInr } from "@/lib/pricing";
import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfirmedBody() {
  const search = useSearchParams();
  const { state } = useStore();
  const { user } = useCurrentUser();
  const booking = (state.bookings ?? []).find((b) => b.id === search.get("booking"));
  if (!user) return null;
  if (!booking) {
    return (
      <div className="card space-y-3 p-6">
        <h1 className="text-2xl font-semibold">Booking confirmed</h1>
        <p className="text-muted">Open your appointments list to see the visit.</p>
        <Link href="/patient/appointments" className="btn btn-primary">
          View appointments
        </Link>
      </div>
    );
  }
  const doctor = state.users.find((u) => u.id === booking.physioId);
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="card space-y-3 p-6">
        <p className="chip">Paid</p>
        <h1 className="text-3xl font-semibold">Booking confirmed</h1>
        <p>
          Your visit with {doctor?.name} is booked. The doctor has been notified.
        </p>
        <p className="text-muted">{booking.reason}</p>
        {booking.amount != null && (
          <p className="font-medium">
            {formatInr(booking.amount)} · {booking.paymentId}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href="/patient/appointments" className="btn btn-primary">
            View appointments
          </Link>
          <Link href={`/patient/chat/${booking.id}`} className="btn btn-ghost">
            Open chat
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmedPage() {
  return (
    <Suspense>
      <ConfirmedBody />
    </Suspense>
  );
}
