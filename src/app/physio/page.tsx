"use client";

import { conditionLabel } from "@/components/Sparkline";
import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";

export default function PhysioHome() {
  const { user } = useCurrentUser();
  const { state } = useStore();
  if (!user) return null;
  const patients = state.profiles.filter((p) => p.assignedPhysioId === user.id);
  const upcoming = state.consults.filter((c) => c.physioId === user.id && c.status === "upcoming");
  const unread = state.notifications.filter((n) => n.userId === user.id && !n.read);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-muted">Clinician workspace</p>
        <h1 className="text-3xl font-semibold">{user.name}</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="card p-5">
          <p className="text-sm text-muted">Patients</p>
          <p className="text-3xl font-semibold">{patients.length}</p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-muted">Upcoming visits</p>
          <p className="text-3xl font-semibold">{upcoming.length}</p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-muted">New feedback</p>
          <p className="text-3xl font-semibold">{unread.filter((n) => n.type === "feedback").length}</p>
        </article>
      </div>
      <article className="card p-5">
        <h2 className="text-xl font-semibold">Caseload</h2>
        <ul className="mt-4 divide-y divide-line">
          {patients.map((p) => {
            const u = state.users.find((x) => x.id === p.userId);
            const program = state.programs.find((pr) => pr.patientId === p.userId && pr.status === "active");
            return (
              <li key={p.userId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">{u?.name}</p>
                  <p className="text-muted">
                    {conditionLabel(p.condition)} · {p.diagnosis}
                  </p>
                  <p className="text-sm text-muted">{program?.name ?? "No active program"}</p>
                </div>
                <Link href={`/physio/patients/${p.userId}`} className="btn btn-primary">
                  Open record
                </Link>
              </li>
            );
          })}
        </ul>
      </article>
    </div>
  );
}
