"use client";

import { Sparkline, conditionLabel } from "@/components/Sparkline";
import { ProgressChart } from "@/components/tracker/ProgressChart";
import { useCurrentUser, useStore } from "@/lib/store";
import type { ProgramItem } from "@/lib/types";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function PatientRecord() {
  const params = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const { state, assignProgram, scheduleConsult, audit } = useStore();
  const patient = state.users.find((u) => u.id === params.id);
  const profile = state.profiles.find((p) => p.userId === params.id);
  const program = state.programs.find((p) => p.patientId === params.id && p.status === "active");
  const feedback = state.completions.filter((c) => c.patientId === params.id).slice(-8).reverse();
  const [name, setName] = useState("Updated home program");
  const [selected, setSelected] = useState<string[]>([]);
  const [topic, setTopic] = useState("Follow-up visit");
  const [when, setWhen] = useState("");

  const viewerId = user?.id;
  const patientName = patient?.name;
  const recordId = patient?.id;
  useEffect(() => {
    if (viewerId && recordId && patientName) {
      audit(viewerId, "view_patient", `Opened ${patientName} record`);
    }
  }, [audit, patientName, recordId, viewerId]);

  if (!patient || !profile || !user) return <p>Patient not found.</p>;
  const patientId = patient.id;
  const physioId = user.id;
  const condition = profile.condition;

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function onAssign(e: FormEvent) {
    e.preventDefault();
    const items: ProgramItem[] = selected.map((exerciseId) => ({
      exerciseId,
      sets: 3,
      reps: 8,
      frequencyPerWeek: 5,
      notes: "Progress if pain stays at or below 3/10.",
    }));
    if (items.length === 0) return;
    assignProgram({ name, patientId, physioId, items });
  }

  function onConsult(e: FormEvent) {
    e.preventDefault();
    if (!when) return;
    scheduleConsult({
      patientId,
      physioId,
      scheduledAt: new Date(when).toISOString(),
      durationMin: 20,
      topic,
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">{patient.name}</h1>
        <p className="text-muted">
          {conditionLabel(profile.condition)} · {profile.diagnosis} · Goal: {profile.goal}
        </p>
      </header>
      <article className="card p-5">
        <h2 className="font-semibold">Pain trend</h2>
        <Sparkline patientId={patient.id} />
      </article>
      <ProgressChart logs={(state.dailyLogs ?? []).filter((l) => l.patientId === patient.id)} />
      <article className="card p-5">
        <h2 className="font-semibold">Current program</h2>
        <p className="text-muted">{program?.name ?? "None"}</p>
        <ul className="mt-3 space-y-1">
          {program?.items.map((i) => {
            const ex = state.exercises.find((e) => e.id === i.exerciseId);
            return (
              <li key={i.exerciseId}>
                {ex?.name} — {i.sets}×{i.reps}
              </li>
            );
          })}
        </ul>
      </article>
      <form onSubmit={onAssign} className="card space-y-3 p-5">
        <h2 className="text-xl font-semibold">Assign a custom program</h2>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid gap-2 md:grid-cols-2">
          {state.exercises
            .filter((e) => e.condition === condition)
            .map((e) => (
              <label key={e.id} className="flex items-center gap-2 rounded-xl border border-line bg-white p-3">
                <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)} />
                {e.name}
              </label>
            ))}
        </div>
        <button className="btn btn-primary" type="submit">
          Assign program
        </button>
      </form>
      <form onSubmit={onConsult} className="card space-y-3 p-5">
        <h2 className="text-xl font-semibold">Book a video visit</h2>
        <input className="field" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <input className="field" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
        <button className="btn btn-primary" type="submit">
          Schedule
        </button>
      </form>
      <article className="card p-5">
        <h2 className="font-semibold">Exercise feedback</h2>
        <ul className="mt-3 space-y-3">
          {feedback.map((c) => {
            const ex = state.exercises.find((e) => e.id === c.exerciseId);
            return (
              <li key={c.id}>
                <p className="font-medium">{ex?.name}</p>
                <p className="text-muted">
                  {c.rating}/5 · pain {c.painAfter} · {c.comment || "No comment"}
                </p>
              </li>
            );
          })}
        </ul>
      </article>
    </div>
  );
}
