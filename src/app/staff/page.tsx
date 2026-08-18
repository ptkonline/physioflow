"use client";

import { BookingList } from "@/components/BookingList";
import { useStore } from "@/lib/store";
import Link from "next/link";

export default function StaffHome() {
  const { state } = useStore();
  const upcoming = (state.bookings ?? []).filter((b) => b.status === "upcoming").length;
  const doctors = state.users.filter((u) => u.role === "physio").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted">Front desk</p>
          <h1 className="text-3xl font-semibold">Clinic bookings</h1>
        </div>
        <Link href="/staff/bookings/new" className="btn btn-primary">
          New booking
        </Link>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="card p-5">
          <p className="text-sm text-muted">Upcoming bookings</p>
          <p className="text-3xl font-semibold">{upcoming}</p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-muted">Doctors on roster</p>
          <p className="text-3xl font-semibold">{doctors}</p>
        </article>
      </div>
      <BookingList />
    </div>
  );
}
