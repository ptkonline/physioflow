"use client";

import { DoctorAvatar } from "@/components/shared/DoctorAvatar";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { formatSlot, openSlots } from "@/lib/availability";
import { averageRating } from "@/lib/reviews";
import { formatInr, quoteFees } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import Link from "next/link";

export default function PatientDoctors() {
  const { state } = useStore();
  const doctors = state.users.filter((u) => u.role === "physio");

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">Find a doctor</h1>
        <p className="text-muted">See specialties and the next open slots. Book yourself — nobody at a desk needs to approve it.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {doctors.map((d) => {
          const profile = state.doctors.find((p) => p.userId === d.id);
          const next = openSlots(d.id, state, 8).slice(0, 3);
          const stars = averageRating(state.reviews ?? [], d.id);
          return (
            <article key={d.id} className="card p-5">
              <div className="flex gap-3">
                <DoctorAvatar name={d.name} photoUrl={profile?.photoUrl || d.profileImageUrl} size={72} />
                <div>
                  <p className="chip">{profile?.clinicId ?? d.id}</p>
                  <h2 className="mt-2 flex flex-wrap items-center gap-2 text-xl font-semibold">
                    {d.name} <VerifiedBadge verified={profile?.isVerified} />
                  </h2>
                  <p className="text-muted">{profile?.specialty ?? "General physiotherapy"}</p>
                  <p className="text-sm font-medium">{formatInr(quoteFees(d.id, profile?.consultationFee).amount)} per visit</p>
                  {stars.count > 0 && (
                    <p className="text-sm text-muted">
                      {stars.avg} / 5 · {stars.count} review{stars.count === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-2">{profile?.bio}</p>
              <p className="mt-3 text-sm font-medium">Next availability</p>
              {next.length === 0 ? (
                <p className="text-muted">No open slots in the next few days.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-muted">
                  {next.map((iso) => (
                    <li key={iso}>{formatSlot(iso)}</li>
                  ))}
                </ul>
              )}
              <Link href={`/patient/doctors/${d.id}`} className="btn btn-primary mt-4">
                View and book
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
