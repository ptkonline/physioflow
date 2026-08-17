"use client";

import { ExerciseCard } from "@/components/ExerciseCard";
import { useCurrentUser, useStore } from "@/lib/store";

export default function PatientProgram() {
  const { user } = useCurrentUser();
  const { state } = useStore();
  if (!user) return null;
  const program = state.programs.find((p) => p.patientId === user.id && p.status === "active");

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">Your program</h1>
        <p className="text-muted">{program?.name ?? "Waiting for assignment"}</p>
      </header>
      {program ? (
        <div className="grid gap-4 md:grid-cols-2">
          {program.items.map((item) => {
            const exercise = state.exercises.find((e) => e.id === item.exerciseId);
            if (!exercise) return null;
            return (
              <ExerciseCard
                key={item.exerciseId}
                exercise={exercise}
                href={`/patient/exercise/${exercise.id}?program=${program.id}`}
                meta={`${item.sets} sets × ${item.reps} reps · ${item.frequencyPerWeek}× / week`}
              />
            );
          })}
        </div>
      ) : (
        <p className="card p-6 text-muted">Your physiotherapist has not assigned a program yet.</p>
      )}
    </div>
  );
}
