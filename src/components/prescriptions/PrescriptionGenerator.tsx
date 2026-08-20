"use client";

import { generatePrescriptionPdf } from "@/lib/prescription-pdf";
import type { PrescriptionMedicine } from "@/lib/care-types";
import { useCurrentUser, useStore } from "@/lib/store";
import { useTranslations } from "next-intl";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const emptyMed = (): PrescriptionMedicine => ({ name: "", dosage: "", frequency: "", duration: "" });

export function PrescriptionGenerator() {
  const t = useTranslations("rx");
  const { user } = useCurrentUser();
  const { state, addPrescription } = useStore();
  const search = useSearchParams();
  const [bookingId, setBookingId] = useState(search.get("booking") ?? "");
  const [title, setTitle] = useState("Home programme");
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([emptyMed()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const mine = useMemo(
    () => (state.bookings ?? []).filter((b) => b.physioId === user?.id),
    [state.bookings, user],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const booking = mine.find((b) => b.id === bookingId);
    if (!booking) {
      setError(t("select"));
      return;
    }
    const doctor = state.doctors.find((d) => d.userId === user.id);
    setBusy(true);
    setError("");
    try {
      const fileUrl = await generatePrescriptionPdf({
        clinicName: doctor?.clinicId ? `Clinic ${doctor.clinicId}` : "PhysioFlow clinic",
        clinicAddress: doctor?.location?.address ?? "",
        doctorName: user.name,
        doctorId: doctor?.clinicId ?? user.id,
        patientName: booking.patientName,
        title,
        medicines,
        notes,
      });
      addPrescription({
        appointmentId: booking.id,
        patientId: booking.patientId,
        doctorId: user.id,
        title: title.trim() || "Prescription",
        fileUrl,
        fileName: `${title.replace(/\s+/g, "-")}.pdf`,
        medicines: medicines.filter((m) => m.name.trim()),
        clinicalNotes: notes,
      });
      setMedicines([emptyMed()]);
      setNotes("");
    } catch {
      setError(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card space-y-3 p-5" onSubmit={(e) => void onSubmit(e)}>
      <label className="block space-y-1">
        <span>{t("appointment")}</span>
        <select className="field" value={bookingId} onChange={(e) => setBookingId(e.target.value)} required>
          <option value="">{t("select")}</option>
          {mine.map((b) => (
            <option key={b.id} value={b.id}>
              {b.patientName} · {b.reason}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span>{t("rxTitle")}</span>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      {medicines.map((med, index) => (
        <div key={index} className="grid gap-2 md:grid-cols-4">
          <input
            className="field"
            placeholder={t("medicine")}
            value={med.name}
            onChange={(e) =>
              setMedicines((rows) => rows.map((row, i) => (i === index ? { ...row, name: e.target.value } : row)))
            }
          />
          <input
            className="field"
            placeholder={t("dosage")}
            value={med.dosage}
            onChange={(e) =>
              setMedicines((rows) => rows.map((row, i) => (i === index ? { ...row, dosage: e.target.value } : row)))
            }
          />
          <input
            className="field"
            placeholder={t("frequency")}
            value={med.frequency}
            onChange={(e) =>
              setMedicines((rows) => rows.map((row, i) => (i === index ? { ...row, frequency: e.target.value } : row)))
            }
          />
          <input
            className="field"
            placeholder={t("duration")}
            value={med.duration}
            onChange={(e) =>
              setMedicines((rows) => rows.map((row, i) => (i === index ? { ...row, duration: e.target.value } : row)))
            }
          />
        </div>
      ))}
      <button type="button" className="btn btn-ghost" onClick={() => setMedicines((rows) => [...rows, emptyMed()])}>
        {t("addRow")}
      </button>
      <textarea className="field min-h-20" placeholder={t("notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
      {error && <p className="text-rose">{error}</p>}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? t("generating") : t("generate")}
      </button>
    </form>
  );
}

export function PrescriptionList({ portal }: { portal: "patient" | "doctor" }) {
  const t = useTranslations("rx");
  const { user } = useCurrentUser();
  const { state } = useStore();
  const rows = (state.prescriptions ?? []).filter((p) =>
    portal === "doctor" ? p.doctorId === user?.id : p.patientId === user?.id,
  );
  if (rows.length === 0) return <p className="card p-6 text-muted">{t("empty")}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((p) => (
        <li key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-semibold">{p.title}</p>
            <p className="text-sm text-muted">{p.fileName}</p>
          </div>
          <a className="btn btn-primary" href={p.fileUrl} download={p.fileName}>
            {t("download")}
          </a>
        </li>
      ))}
    </ul>
  );
}
