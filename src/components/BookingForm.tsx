"use client";

import { CONDITIONS } from "@/lib/seed";
import { clinicPoint } from "@/lib/geo";
import { formatInr } from "@/lib/pricing";
import { bookableServices, serviceVisitMode } from "@/lib/services";
import { useCurrentUser, useStore } from "@/lib/store";
import type { Condition } from "@/lib/types";
import type { VisitMode } from "@/lib/care-types";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

export function BookingForm({ afterHref }: { afterHref: string }) {
  const { user } = useCurrentUser();
  const { state, createBooking } = useStore();
  const router = useRouter();
  const doctors = useMemo(
    () =>
      state.users
        .filter((u) => u.role === "physio")
        .map((u) => ({
          ...u,
          clinicId: state.doctors.find((d) => d.userId === u.id)?.clinicId ?? u.id,
          specialty: state.doctors.find((d) => d.userId === u.id)?.specialty ?? "General physiotherapy",
        })),
    [state.doctors, state.users],
  );
  const defaultDoctor = user?.role === "physio" ? user.id : doctors[0]?.id ?? "";
  const [physioId, setPhysioId] = useState(defaultDoctor);
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [when, setWhen] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [condition, setCondition] = useState<Condition>("knee");
  const [mode, setMode] = useState<VisitMode>("online");
  const [serviceId, setServiceId] = useState("");
  const [error, setError] = useState("");

  if (!user) return null;
  const createdById = user.id;
  const profile = state.doctors.find((d) => d.userId === physioId);
  const services = profile ? bookableServices(profile) : [];
  const service = services.find((item) => item.id === serviceId) ?? services[0];
  const visitMode: VisitMode = service ? serviceVisitMode(service, mode) : "online";

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!physioId || !when) {
      setError("Choose a doctor and a date.");
      return;
    }
    const pin = clinicPoint(profile);
    const price = service?.price;
    const ok = createBooking({
      createdById,
      physioId,
      patientName,
      patientEmail,
      patientPhone,
      scheduledAt: new Date(when).toISOString(),
      durationMin: service?.durationMin ?? durationMin,
      reason,
      notes,
      condition,
      mode: visitMode,
      finalPrice: price,
      clinicAddress: visitMode === "offline" ? pin?.address : undefined,
      consultationFee: price,
      amount: price,
      serviceId: service?.id,
      serviceName: service?.name || (service?.id === "visit-online" ? "Online consultation" : "Clinic visit"),
    });
    if (!ok) {
      setError("Could not create this booking. Check the email is not already used by staff or a doctor.");
      return;
    }
    router.push(afterHref);
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <label className="block space-y-1">
        <span>Doctor (assigned automatically)</span>
        <select className="field" value={physioId} onChange={(e) => setPhysioId(e.target.value)} required>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} · {d.clinicId} · {d.specialty}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="space-y-2">
        <legend className="font-medium">Treatment</legend>
        <div className="grid gap-2">
          {services.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`service-card ${service?.id === item.id ? "on" : ""}`}
              onClick={() => {
                setServiceId(item.id);
                if (item.mode !== "both") setMode(item.mode);
              }}
            >
              <span className="min-w-0 flex-1 font-semibold">
                {item.name || (item.id === "visit-online" ? "Online consultation" : "Clinic visit")}
              </span>
              <span className="price-tag">{formatInr(item.price)}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block space-y-1">
        <span>Patient full name</span>
        <input className="field" value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span>Email</span>
          <input className="field" type="email" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} required />
        </label>
        <label className="block space-y-1">
          <span>Phone</span>
          <input className="field" type="tel" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} required />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span>Appointment date and time</span>
          <input className="field" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
        </label>
        <label className="block space-y-1">
          <span>Length (minutes)</span>
          <input
            className="field"
            type="number"
            min={15}
            step={15}
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span>Main condition</span>
        <select className="field" value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
          {CONDITIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
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
      <p className="text-sm text-muted">
        Saving places this visit on the chosen doctor’s dashboard at once. They do not need a separate assignment step.
      </p>
      <button className="btn btn-primary" type="submit">
        Create booking
      </button>
    </form>
  );
}
