"use client";

import { useCurrentUser, useStore } from "@/lib/store";
import { FormEvent, useState } from "react";

export default function FeedbackPage() {
  const { user } = useCurrentUser();
  const { state, addNotification } = useStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  if (!user) return null;
  const patientId = user.id;
  const patientName = user.name;

  const logs = state.completions.filter((c) => c.patientId === patientId);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    addNotification({
      userId: patientId,
      title: "Thanks for your feedback",
      body: `You rated your latest session ${rating}/5.`,
      type: "feedback",
      href: "/patient/progress",
    });
    const physioId = state.profiles.find((p) => p.userId === patientId)?.assignedPhysioId;
    if (physioId) {
      addNotification({
        userId: physioId,
        title: `Feedback from ${patientName}`,
        body: comment || `${rating}/5`,
        type: "feedback",
        href: "/physio/patients/" + patientId,
      });
    }
    setComment("");
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Feedback</h1>
      <p className="text-muted">Rate exercises and visits so your physiotherapist can adjust the plan.</p>
      <form className="card space-y-3 p-5" onSubmit={onSubmit}>
        <h2 className="font-semibold">How was your latest visit?</h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`h-12 w-12 rounded-xl ${n <= rating ? "bg-teal text-white" : "bg-sage"}`}
            >
              {n}
            </button>
          ))}
        </div>
        <textarea
          className="field min-h-24"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Anything we should change next time?"
        />
        <button className="btn btn-primary" type="submit">
          Submit
        </button>
      </form>
      <ul className="space-y-3">
        {logs.map((f) => {
          const ex = state.exercises.find((e) => e.id === f.exerciseId);
          return (
            <li key={f.id} className="card p-5">
              <p className="font-medium">
                {ex?.name} · {f.rating}/5
              </p>
              <p className="text-muted">{f.comment || "No comment"}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
