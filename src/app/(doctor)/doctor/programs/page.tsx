"use client";

import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";

export default function PhysioPrograms() {
  const { user } = useCurrentUser();
  const { state } = useStore();
  const programs = state.programs.filter((p) => p.physioId === user?.id);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Assigned programs</h1>
      <ul className="space-y-3">
        {programs.map((p) => {
          const patient = state.users.find((u) => u.id === p.patientId);
          return (
            <li key={p.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-muted">
                    {patient?.name} · {p.items.length} exercises · {p.status}
                  </p>
                </div>
                <Link href={`/doctor/patients/${p.patientId}`} className="btn btn-ghost">
                  Edit assignment
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
