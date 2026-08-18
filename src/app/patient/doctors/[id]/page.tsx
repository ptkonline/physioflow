"use client";

import { formatSlot, openSlots } from "@/lib/availability";
import { useCurrentUser, useStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

export default function DoctorProfilePage() {
  const params = useParams<{ id: string }>();
  const { user, profile } = useCurrentUser();
  const { state, createBooking } = useStore();
  const router = useRouter();
  const doctor = state.users.find((u) => u.id === params.id && u.role === "physio");
  const docProfile = state.doctors.find((d) => d.userId === params.id);
  const slots = useMemo(() => (doctor ? openSlots(doctor.id, state, 12) : []), [doctor, state]);
  const [slot, setSlot] = useState("");
  const [reason, setReason] = useState(profile?.goal ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!doctor || !user || !profile) return <p>Doctor not found.</p>;
  const patientId = user.id;
  const patientName = user.name;
  const patientEmail = user.email;
  const patientPhone = profile.phone || user.phone || "";
  const doctorId = doctor.id;
  const doctorName = doctor.name;
  const slotMin = docProfile?.availability?.slotMin ?? 30;
  const condition = profile.condition;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!slot) {
      setError("Choose an open time.");
      return;
    }
    const ok = createBooking({
      createdById: patientId,
      physioId: doctorId,
      patientName,
      patientEmail,
      patientPhone,
      scheduledAt: slot,
      durationMin: slotMin,
      reason,
      notes,
      condition,
    });
    if (!ok) {
      setError("That slot could not be booked. Try another time.");
      return;
    }
    setDone(true);
    router.push("/patient/appointments");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <p className="chip">{docProfile?.clinicId}</p>
        <h1 className="mt-2 text-3xl font-semibold">{doctor.name}</h1>
        <p className="text-muted">{docProfile?.specialty}</p>
        <p className="mt-2">{docProfile?.bio}</p>
        {docProfile?.qualifications && <p className="text-sm text-muted">{docProfile.qualifications}</p>}
      </header>
      <form onSubmit={onSubmit} className="card space-y-4 p-5">
        <h2 className="text-xl font-semibold">Book this doctor</h2>
        <p className="text-muted">
          Booking as {patientName}. The appointment appears on {doctorName}’s dashboard as soon as you confirm.
        </p>
        <label className="block space-y-1">
          <span>Open slot</span>
          <select className="field" value={slot} onChange={(e) => setSlot(e.target.value)} required>
            <option value="">Select a time</option>
            {slots.map((iso) => (
              <option key={iso} value={iso}>
                {formatSlot(iso)}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span>Reason for visit</span>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} required />
        </label>
        <label className="block space-y-1">
          <span>Notes for the doctor</span>
          <textarea className="field min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {error && <p className="text-rose">{error}</p>}
        <button className="btn btn-primary" type="submit">
          Confirm booking
        </button>
        {done && <p className="text-teal-dark">Booked. Sending you to your appointments…</p>}
      </form>
    </div>
  );
}
