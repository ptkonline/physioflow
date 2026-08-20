"use client";

import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";

export default function PhysioConsults() {
  const { user } = useCurrentUser();
  const { state } = useStore();
  const calls = state.consults
    .filter((c) => c.physioId === user?.id)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Consultations</h1>
        <Link href="/doctor/appointments/new" className="btn btn-primary">
          New booking
        </Link>
      </div>
      <ul className="space-y-3">
        {calls.map((c) => {
          const patient = state.users.find((u) => u.id === c.patientId);
          return (
            <li key={c.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-semibold">{c.topic}</p>
                <p className="text-muted">
                  {patient?.name} · {new Date(c.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <span className="chip mt-2">{c.status}</span>
              </div>
              <Link href={`/consult/${c.id}`} className="btn btn-primary">
                Join room
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
