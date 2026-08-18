"use client";

import { BookingList } from "@/components/BookingList";
import Link from "next/link";

export default function StaffBookings() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">All bookings</h1>
        <Link href="/staff/bookings/new" className="btn btn-primary">
          New booking
        </Link>
      </div>
      <BookingList />
    </div>
  );
}
