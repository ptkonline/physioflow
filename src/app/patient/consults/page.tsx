"use client";

import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";

export default function PatientConsults() {
  const { user } = useCurrentUser();
  const { state } = useStore();
  if (!user) return null;
  const calls = state.consults
    .filter((c) => c.patientId === user.id)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Video visits</h1>
      <ul className="space-y-3">
        {calls.map((c) => {
          const physio = state.users.find((u) => u.id === c.physioId);
          return (
            <li key={c.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-semibold">{c.topic}</p>
                <p className="text-muted">
                  {physio?.name} · {new Date(c.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <span className="chip mt-2">{c.status}</span>
              </div>
              {c.status !== "cancelled" && (
                <Link href={`/consult/${c.id}`} className="btn btn-primary">
                  {c.status === "completed" ? "Review room" : "Join"}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
