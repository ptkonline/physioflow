"use client";

import { BookVisitWizard } from "@/components/booking/BookVisitWizard";
import { DoctorAvatar } from "@/components/shared/DoctorAvatar";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { MapDirectionButton } from "@/components/maps/MapDirectionButton";
import { averageRating } from "@/lib/reviews";
import { useCurrentUser, useStore } from "@/lib/store";
import { useParams } from "next/navigation";

export default function DoctorProfilePage() {
  const params = useParams<{ id: string }>();
  const { user, profile } = useCurrentUser();
  const { state } = useStore();
  const doctor = state.users.find((u) => u.id === params.id && u.role === "physio");
  const docProfile = state.doctors.find((d) => d.userId === params.id);

  if (!doctor || !user || !profile || !docProfile) return <p>Doctor not found.</p>;
  const stars = averageRating(state.reviews ?? [], doctor.id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex gap-4">
        <DoctorAvatar name={doctor.name} photoUrl={docProfile?.photoUrl || doctor.profileImageUrl} size={96} />
        <div>
          <p className="chip">{docProfile?.clinicId}</p>
          <h1 className="mt-2 flex flex-wrap items-center gap-2 text-3xl font-semibold">
            {doctor.name} <VerifiedBadge verified={docProfile?.isVerified} />
          </h1>
          <p className="text-muted">{docProfile?.specialty}</p>
          <p className="mt-2">{docProfile?.bio}</p>
          {docProfile?.qualifications && <p className="text-sm text-muted">{docProfile.qualifications}</p>}
          {stars.count > 0 && (
            <p className="mt-1 text-sm text-muted">
              {stars.avg} / 5 · {stars.count} review{stars.count === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </header>
      <MapDirectionButton location={docProfile.location} clinicName={doctor.name} />
      {(state.reviews ?? []).filter((r) => r.doctorId === doctor.id).length > 0 && (
        <article className="card space-y-3 p-5">
          <h2 className="font-semibold">Reviews</h2>
          {(state.reviews ?? [])
            .filter((r) => r.doctorId === doctor.id)
            .map((r) => (
              <p key={r.id} className="border-t border-line pt-3 text-sm">
                ★ {r.rating}/5 — {r.comment || "No comment"}
              </p>
            ))}
        </article>
      )}
      <BookVisitWizard doctorUser={doctor} doctor={docProfile} patient={user} profile={profile} />
    </div>
  );
}
