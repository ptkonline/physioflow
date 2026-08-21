"use client";

import { RatingAndReview } from "@/components/reviews/RatingAndReview";
import { formatSlot } from "@/lib/availability";
import { formatInr } from "@/lib/pricing";
import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";

export function BookingList({
  physioId,
  patientId,
}: {
  physioId?: string;
  patientId?: string;
}) {
  const { user } = useCurrentUser();
  const { state, setBookingStatus } = useStore();
  const rows = (state.bookings ?? [])
    .filter((b) => (physioId ? b.physioId === physioId : true))
    .filter((b) => (patientId ? b.patientId === patientId : true))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  if (rows.length === 0) {
    return <p className="card p-6 text-muted">No appointments yet.</p>;
  }

  const isDoctor = user?.role === "physio";
  const chatBase = isDoctor ? "/doctor/chat" : "/patient/chat";
  const rxBase = isDoctor ? "/doctor/prescriptions" : "/patient/prescriptions";

  return (
    <ul className="space-y-3">
      {rows.map((b) => {
        const doctor = state.users.find((u) => u.id === b.physioId);
        const clinicId = state.doctors.find((d) => d.userId === b.physioId)?.clinicId;
        return (
          <li key={b.id} className="card space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted">
                  {formatSlot(b.scheduledAt)} · {b.durationMin} min
                  {b.mode ? ` · ${b.mode === "offline" ? "Clinic visit" : "Online"}` : ""}
                </p>
                <p className="text-xl font-semibold">{isDoctor ? b.patientName : doctor?.name}</p>
                <p className="text-muted">{b.reason}</p>
                <p className="text-sm text-muted">
                  {b.patientPhone} · {b.patientEmail}
                </p>
                {b.notes && <p className="mt-1 text-sm">Notes: {b.notes}</p>}
                <p className="text-sm text-muted">
                  {doctor?.name} {clinicId ? `· ${clinicId}` : ""}
                </p>
                <span className="chip mt-2">{b.status}</span>
                {b.mode && <span className="chip mt-2 ml-2">{b.mode === "offline" ? "Offline" : "Online"}</span>}
                {b.paymentStatus && <span className="chip mt-2 ml-2">{b.paymentStatus}</span>}
                {b.amount != null && b.amount > 0 && (
                  <p className="mt-2 text-sm text-muted">
                    {b.currency ?? "INR"} {b.amount}
                    {b.paymentId ? ` · ${b.paymentId}` : ""}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`${chatBase}/${b.id}`} className="btn btn-primary">
                  Open chat
                </Link>
                {b.mode !== "offline" && (
                <Link href={b.meetingLink || `/consult/${b.consultId}`} className="btn btn-ghost">
                  Open visit
                </Link>
                )}
                <Link href={`${rxBase}?booking=${b.id}`} className="btn btn-ghost">
                  Prescriptions
                </Link>
              </div>
            </div>
            {isDoctor && b.status === "upcoming" && (
              <button type="button" className="btn btn-ghost" onClick={() => setBookingStatus(b.id, "completed")}>
                Mark completed
              </button>
            )}
            {!isDoctor && b.status === "completed" && user && (
              <RatingAndReview
                appointmentId={b.id}
                patientId={user.id}
                doctorId={b.physioId}
                doctorName={doctor?.name ?? "your doctor"}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
