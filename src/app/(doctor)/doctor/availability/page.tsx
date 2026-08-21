"use client";

import { DoctorPracticeForm } from "@/components/doctor/DoctorPracticeForm";
import { DEFAULT_HOURS, type WeekHours } from "@/lib/types";
import { useCurrentUser, useStore } from "@/lib/store";
import { FormEvent, useState } from "react";

const DAY_OPTIONS = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
];

export default function DoctorHours() {
  const { user } = useCurrentUser();
  const { state, updateDoctor } = useStore();
  const existing = state.doctors.find((d) => d.userId === user?.id);
  const [hours, setHours] = useState<WeekHours>(existing?.availability ?? DEFAULT_HOURS);
  const [saved, setSaved] = useState(false);
  if (!user || !existing) return <p>No doctor profile yet.</p>;
  const doctor = existing;

  function toggleDay(id: number) {
    setHours((h) => ({
      ...h,
      days: h.days.includes(id) ? h.days.filter((d) => d !== id) : [...h.days, id].sort(),
    }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    updateDoctor({ ...doctor, availability: hours });
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <h1 className="text-3xl font-semibold">Clinic hours</h1>
      <p className="text-muted">Open slots update for patients as soon as you save. Booked times stay blocked.</p>
      <fieldset>
        <legend className="font-semibold">Days</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`btn ${hours.days.includes(d.id) ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleDay(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span>Start hour</span>
          <input
            className="field"
            type="number"
            min={6}
            max={20}
            value={hours.startHour}
            onChange={(e) => setHours({ ...hours, startHour: Number(e.target.value) })}
          />
        </label>
        <label className="block space-y-1">
          <span>End hour</span>
          <input
            className="field"
            type="number"
            min={7}
            max={22}
            value={hours.endHour}
            onChange={(e) => setHours({ ...hours, endHour: Number(e.target.value) })}
          />
        </label>
      </div>
      <button className="btn btn-primary" type="submit">
        Save hours
      </button>
      {saved && <p className="text-teal-dark">Patients now see these open slots.</p>}
    </form>
    <DoctorPracticeForm />
    </div>
  );
}
