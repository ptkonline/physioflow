"use client";

import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { SlotCalendar } from "@/components/SlotCalendar";
import { DEFAULT_HOURS, type WeekHours } from "@/lib/types";
import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";
import { FormEvent, useState } from "react";

const DAY_OPTIONS = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
];

export default function PhysioSettings() {
  const { user } = useCurrentUser();
  const { state, resetDemo, updateDoctor, addNotification } = useStore();
  const existing = user ? state.doctors.find((d) => d.userId === user.id) : undefined;
  const [hours, setHours] = useState<WeekHours>(existing?.availability ?? DEFAULT_HOURS);
  const [saved, setSaved] = useState(false);

  if (!user) return null;
  const events = state.audit.filter((a) => a.actorId === user.id).slice(-12).reverse();

  function toggleDay(id: number) {
    setHours((h) => ({
      ...h,
      days: h.days.includes(id) ? h.days.filter((d) => d !== id) : [...h.days, id].sort(),
    }));
  }

  function onSaveAvailability(e: FormEvent) {
    e.preventDefault();
    if (!user || !existing) return;
    updateDoctor({ ...existing, availability: hours });
    addNotification({
      userId: user.id,
      title: "Availability saved",
      body: "Patients will see your updated open slots.",
      type: "system",
      href: "/doctor/availability",
    });
    setSaved(true);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Clinic settings</h1>

      <form onSubmit={onSaveAvailability} className="card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Availability</h2>
          <Link href="/doctor/availability" className="text-sm underline">
            Full clinic hours page
          </Link>
        </div>
        {!existing ? (
          <p className="text-muted">No doctor profile yet.</p>
        ) : (
          <>
            <fieldset>
              <legend className="text-sm font-medium">Days</legend>
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
              <label className="block space-y-1">
                <span>Session duration</span>
                <select
                  className="field"
                  value={hours.slotMin}
                  onChange={(e) => setHours({ ...hours, slotMin: Number(e.target.value) })}
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
              </label>
            </div>
            <SlotCalendar physioId={user.id} state={state} value="" onChange={() => undefined} />
            <button type="submit" className="btn btn-primary">
              Save availability
            </button>
            {saved && <p className="text-sm text-teal-dark">Saved. Open slots updated for patients.</p>}
          </>
        )}
      </form>

      <article className="card space-y-3 p-5">
        <h2 className="font-semibold">Language</h2>
        <LocaleSwitcher />
      </article>
      <article className="card space-y-3 p-5">
        <p>
          This workspace keeps an access log for patient records. A production deployment would add encryption at rest,
          MFA, and a HIPAA-eligible host.
        </p>
        <Link href="/privacy" className="btn btn-ghost inline-flex">
          Privacy notice
        </Link>
        <button type="button" className="btn btn-ghost" onClick={resetDemo}>
          Reset demo data
        </button>
      </article>
      <article className="card p-5">
        <h2 className="font-semibold">Audit log</h2>
        <ul className="mt-3 space-y-2">
          {events.map((e) => (
            <li key={e.id} className="text-muted">
              {new Date(e.at).toLocaleString()} — {e.action}: {e.detail}
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
