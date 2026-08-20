"use client";

import { BookingForm } from "@/components/BookingForm";

export default function PhysioNewBooking() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl font-semibold">New booking</h1>
      <p className="text-muted">Defaults to your clinic ID. You can also book a colleague; it will show on their dashboard at once.</p>
      <BookingForm afterHref="/doctor/appointments" />
    </div>
  );
}
