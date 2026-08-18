"use client";

import { useStore } from "@/lib/store";

export function DoctorDirectory() {
  const { state } = useStore();
  const doctors = state.users.filter((u) => u.role === "physio");

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {doctors.map((d) => {
        const profile = state.doctors.find((p) => p.userId === d.id);
        const upcoming = (state.bookings ?? []).filter((b) => b.physioId === d.id && b.status === "upcoming").length;
        return (
          <li key={d.id} className="card p-5">
            <p className="chip">{profile?.clinicId ?? d.id}</p>
            <h3 className="mt-2 text-xl font-semibold">{d.name}</h3>
            <p className="text-muted">{profile?.specialty ?? "General physiotherapy"}</p>
            <p className="mt-2 text-sm text-muted">{d.email}</p>
            <p className="text-sm text-muted">{profile?.phone || d.phone}</p>
            {profile?.bio && <p className="mt-2">{profile.bio}</p>}
            <p className="mt-3 text-sm font-medium">{upcoming} upcoming booking{upcoming === 1 ? "" : "s"}</p>
          </li>
        );
      })}
    </ul>
  );
}
