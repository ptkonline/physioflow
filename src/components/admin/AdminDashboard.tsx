"use client";

import { useStore } from "@/lib/store";
import { CalendarDays, CheckCircle2, Clock, Stethoscope, Users, XCircle } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

function isSameDay(iso: string, ref: Date) {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone = "teal",
}: {
  label: string;
  value: number;
  icon: ComponentType<{ size?: number }>;
  tone?: "teal" | "amber" | "rose" | "sage";
}) {
  const toneClass =
    tone === "amber"
      ? "bg-amber/15 text-amber"
      : tone === "rose"
        ? "bg-rose/15 text-rose"
        : tone === "sage"
          ? "bg-sage text-teal-dark"
          : "bg-teal/15 text-teal";
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className={`grid h-12 w-12 place-items-center rounded-2xl ${toneClass}`}>
        <Icon size={22} />
      </span>
      <div>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { state, hydrated } = useStore();
  if (!hydrated) return <p className="text-muted">Loading dashboard…</p>;

  const today = new Date();
  const bookings = state.bookings ?? [];
  const bookingsToday = bookings.filter((b) => isSameDay(b.scheduledAt, today));
  const pending = bookings.filter((b) => b.status === "upcoming");
  const completed = bookings.filter((b) => b.status === "completed");
  const cancelled = bookings.filter((b) => b.status === "cancelled");
  const doctors = state.users.filter((u) => u.role === "physio");
  const activeDoctors = doctors.filter((u) => {
    const p = state.doctors.find((d) => d.userId === u.id);
    return p ? p.active !== false : true;
  });
  const patients = state.users.filter((u) => u.role === "patient");

  const upcomingSoon = [...pending]
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 6);

  const doctorName = (id: string) => state.users.find((u) => u.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-muted">Clinic overview</p>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Bookings today" value={bookingsToday.length} icon={CalendarDays} tone="teal" />
        <Stat label="Pending (upcoming)" value={pending.length} icon={Clock} tone="amber" />
        <Stat label="Active doctors" value={activeDoctors.length} icon={Stethoscope} tone="sage" />
        <Stat label="Total patients" value={patients.length} icon={Users} tone="teal" />
        <Stat label="Completed" value={completed.length} icon={CheckCircle2} tone="sage" />
        <Stat label="Cancelled" value={cancelled.length} icon={XCircle} tone="rose" />
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-xl font-semibold">Next upcoming bookings</h2>
          <Link href="/admin/bookings" className="text-sm text-teal no-underline">
            View all →
          </Link>
        </div>
        {upcomingSoon.length === 0 ? (
          <p className="px-5 py-6 text-muted">No upcoming bookings.</p>
        ) : (
          <ul className="divide-y divide-line">
            {upcomingSoon.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div>
                  <p className="font-medium">
                    {b.patientName} <span className="text-muted">with {doctorName(b.physioId)}</span>
                  </p>
                  <p className="text-sm text-muted">{b.reason}</p>
                </div>
                <span className="text-sm text-muted">{new Date(b.scheduledAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
