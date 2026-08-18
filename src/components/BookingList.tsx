"use client";

import { formatSlot } from "@/lib/availability";
import { useStore } from "@/lib/store";
import Link from "next/link";

export function BookingList({
  physioId,
  patientId,
}: {
  physioId?: string;
  patientId?: string;
}) {
  const { state } = useStore();
  const rows = (state.bookings ?? [])
    .filter((b) => (physioId ? b.physioId === physioId : true))
    .filter((b) => (patientId ? b.patientId === patientId : true))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  if (rows.length === 0) {
    return <p className="card p-6 text-muted">No appointments yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((b) => {
        const doctor = state.users.find((u) => u.id === b.physioId);
        const clinicId = state.doctors.find((d) => d.userId === b.physioId)?.clinicId;
        return (
          <li key={b.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-sm text-muted">{formatSlot(b.scheduledAt)} · {b.durationMin} min</p>
              <p className="text-xl font-semibold">{b.patientName}</p>
              <p className="text-muted">{b.reason}</p>
              <p className="text-sm text-muted">
                {b.patientPhone} · {b.patientEmail}
              </p>
              {b.notes && <p className="mt-1 text-sm">Notes: {b.notes}</p>}
              <p className="text-sm text-muted">
                {doctor?.name} {clinicId ? `· ${clinicId}` : ""}
              </p>
              <span className="chip mt-2">{b.status}</span>
            </div>
            <Link href={`/consult/${b.consultId}`} className="btn btn-primary">
              Open visit
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
