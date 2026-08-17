"use client";

import { PainScale } from "@/components/PainScale";
import { Sparkline } from "@/components/Sparkline";
import { useCurrentUser, useStore } from "@/lib/store";
import { FormEvent, useState } from "react";

export default function ProgressPage() {
  const { user } = useCurrentUser();
  const { state, logPain } = useStore();
  const [level, setLevel] = useState(3);
  const [note, setNote] = useState("");
  if (!user) return null;
  const patientId = user.id;

  const completions = state.completions.filter((c) => c.patientId === patientId);
  const pain = state.painLogs.filter((p) => p.patientId === user.id);
  const avgPain =
    pain.length === 0 ? 0 : Math.round((pain.reduce((s, p) => s + p.level, 0) / pain.length) * 10) / 10;
  const avgRating =
    completions.length === 0
      ? 0
      : Math.round((completions.reduce((s, c) => s + c.rating, 0) / completions.length) * 10) / 10;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    logPain(patientId, level, note);
    setNote("");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Progress</h1>
        <p className="text-muted">A simple view of recovery — completions, pain, and feedback.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="card p-5">
          <p className="text-sm text-muted">Sessions logged</p>
          <p className="text-3xl font-semibold">{completions.length}</p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-muted">Average pain</p>
          <p className="text-3xl font-semibold">{avgPain}</p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-muted">Exercise rating</p>
          <p className="text-3xl font-semibold">{avgRating}/5</p>
        </article>
      </div>
      <article className="card p-5">
        <h2 className="font-semibold">Pain trend</h2>
        <Sparkline patientId={patientId} />
      </article>
      <form onSubmit={onSubmit} className="card space-y-4 p-5">
        <h2 className="text-xl font-semibold">Log pain now</h2>
        <PainScale value={level} onChange={setLevel} />
        <input className="field" placeholder="Optional note" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn btn-primary" type="submit">
          Save
        </button>
      </form>
      <article className="card p-5">
        <h2 className="font-semibold">Recent feedback</h2>
        <ul className="mt-3 space-y-3">
          {completions.slice(-6).reverse().map((c) => {
            const ex = state.exercises.find((e) => e.id === c.exerciseId);
            return (
              <li key={c.id} className="border-t border-line pt-3">
                <p className="font-medium">{ex?.name}</p>
                <p className="text-muted">
                  Pain {c.painAfter}/10 · Rated {c.rating}/5 · {c.comment || "No comment"}
                </p>
              </li>
            );
          })}
        </ul>
      </article>
    </div>
  );
}
