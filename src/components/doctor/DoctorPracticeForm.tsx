"use client";

import { LocationSelector } from "@/components/maps/LocationSelector";
import type { ClinicLocation } from "@/lib/care-types";
import { persistDoctorPublic } from "@/lib/doctor-public";
import { clinicPoint, toDoctorLocation } from "@/lib/geo";
import { useCurrentUser, useStore } from "@/lib/store";
import { FormEvent, useState } from "react";

export function DoctorPracticeForm() {
  const { user } = useCurrentUser();
  const { state, updateDoctor } = useStore();
  const doctor = state.doctors.find((d) => d.userId === user?.id);
  const [onlineFee, setOnlineFee] = useState(doctor?.pricing?.onlineFee ?? doctor?.consultationFee ?? 800);
  const [offlineFee, setOfflineFee] = useState(doctor?.pricing?.offlineFee ?? Math.round((doctor?.consultationFee ?? 800) * 1.2));
  const [clinic, setClinic] = useState<ClinicLocation | null>(clinicPoint(doctor));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user || !doctor) return <p>No doctor profile yet.</p>;
  const profile = doctor;
  const account = user;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!clinic || !clinic.address.trim()) {
      setError("Set a clinic address and map pin.");
      return;
    }
    if (!(onlineFee > 0) || !(offlineFee > 0)) {
      setError("Online and clinic visit fees must be positive amounts.");
      return;
    }
    const next = {
      ...profile,
      clinicLocation: clinic,
      location: toDoctorLocation(clinic),
      consultationFee: Math.round(onlineFee),
      pricing: {
        onlineFee: Math.round(onlineFee),
        offlineFee: Math.round(offlineFee),
        currency: "INR",
      },
    };
    updateDoctor(next);
    setBusy(true);
    try {
      await persistDoctorPublic(next, account.email);
      setSaved(true);
    } catch (err) {
      setSaved(true);
      setError(err instanceof Error ? err.message : "Saved on this device. Firestore sync needs Email/Password auth.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="card space-y-4 p-6">
      <h2 className="text-xl font-semibold">Location and fees</h2>
      <p className="text-muted">Patients sort by distance and see both online and in-clinic prices.</p>
      <LocationSelector value={clinic} onChange={setClinic} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span>Online fee (₹)</span>
          <input
            className="field"
            type="number"
            min={1}
            step={50}
            value={onlineFee}
            onChange={(e) => setOnlineFee(Number(e.target.value))}
            required
          />
        </label>
        <label className="block space-y-1">
          <span>Offline / clinic fee (₹)</span>
          <input
            className="field"
            type="number"
            min={1}
            step={50}
            value={offlineFee}
            onChange={(e) => setOfflineFee(Number(e.target.value))}
            required
          />
        </label>
      </div>
      {error && <p className="text-rose">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save location and fees"}
      </button>
      {saved && !error && <p className="text-teal-dark">Patients now see this pin and these prices.</p>}
    </form>
  );
}
