"use client";

import { conditionLabel } from "@/components/Sparkline";
import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";

export default function PatientsPage() {
  const { user } = useCurrentUser();
  const { state } = useStore();
  const patients = state.profiles.filter((p) => p.assignedPhysioId === user?.id);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Patients</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {patients.map((p) => {
          const u = state.users.find((x) => x.id === p.userId);
          const logs = state.completions.filter((c) => c.patientId === p.userId).length;
          return (
            <Link key={p.userId} href={`/physio/patients/${p.userId}`} className="card p-5 no-underline">
              <p className="text-xl font-semibold">{u?.name}</p>
              <p className="text-muted">{conditionLabel(p.condition)}</p>
              <p className="mt-2 text-sm text-muted">{logs} exercise logs · Goal: {p.goal}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
