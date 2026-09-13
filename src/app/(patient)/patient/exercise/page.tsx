"use client";

import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";

export default function PatientExerciseIndex() {
  const { user } = useCurrentUser();
  const { state } = useStore();
  if (!user) return null;
  const program = state.programs.find((p) => p.patientId === user.id && p.status === "active");

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Start exercises</h1>
      {!program ? (
        <p className="card p-6 text-muted">No active program yet. Your clinician will assign one soon.</p>
      ) : (
        <ul className="space-y-3">
          {program.items.map((item) => {
            const ex = state.exercises.find((e) => e.id === item.exerciseId);
            if (!ex) return null;
            return (
              <li key={item.exerciseId} className="card flex items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold">{ex.name}</p>
                  <p className="text-muted">
                    {item.sets} × {item.reps} · {item.frequencyPerWeek}× / week
                  </p>
                </div>
                <Link href={`/patient/exercise/${ex.id}?program=${program.id}`} className="btn btn-primary">
                  Start
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/patient/program" className="btn btn-ghost">
        Full program
      </Link>
    </div>
  );
}
