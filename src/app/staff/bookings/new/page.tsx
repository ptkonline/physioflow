"use client";

import { BookingForm } from "@/components/BookingForm";

export default function NewBookingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">New booking</h1>
        <p className="text-muted">
          Add the patient and pick a doctor. The visit is linked to that doctor’s ID and shows on their dashboard immediately.
        </p>
      </header>
      <BookingForm afterHref="/staff/bookings" />
    </div>
  );
}
