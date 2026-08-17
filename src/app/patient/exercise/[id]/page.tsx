"use client";

import { PainScale } from "@/components/PainScale";
import { useCurrentUser, useStore } from "@/lib/store";
import { useParams, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const { state, completeExercise } = useStore();
  const { user } = useCurrentUser();
  const exercise = state.exercises.find((e) => e.id === params.id);
  const programId = search.get("program") ?? state.programs.find((p) => p.patientId === user?.id && p.status === "active")?.id;
  const [pain, setPain] = useState(3);
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  if (!exercise || !user) return <p>Exercise not found.</p>;
  const patientId = user.id;
  const exerciseId = exercise.id;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!programId) {
      setDone(true);
      return;
    }
    completeExercise({
      patientId,
      exerciseId,
      programId,
      painAfter: pain,
      rating,
      comment,
    });
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-3xl font-semibold">{exercise.name}</h1>
      <video className="w-full rounded-2xl bg-ink" controls playsInline poster={exercise.thumbnail} src={exercise.videoUrl} />
      <article className="card space-y-3 p-5">
        <p>{exercise.description}</p>
        <ol className="list-decimal space-y-2 pl-5">
          {exercise.instructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="rounded-xl bg-sand px-4 py-3">
          <strong>Safety: </strong>
          {exercise.precautions}
        </p>
      </article>
      <form onSubmit={onSubmit} className="card space-y-4 p-5">
        <h2 className="text-xl font-semibold">How did it feel?</h2>
        <PainScale value={pain} onChange={setPain} />
        <fieldset>
          <legend className="font-semibold">Rate this exercise</legend>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`grid h-12 w-12 place-items-center rounded-xl border ${rating === n ? "border-teal bg-teal text-white" : "border-line bg-white"}`}
                onClick={() => setRating(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block space-y-1">
          <span>Comment for your clinician</span>
          <textarea className="field min-h-24" value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>
        <button className="btn btn-primary" type="submit">
          Mark complete
        </button>
        {done && <p className="text-teal-dark">Saved. Thank you — this helps tailor your next session.</p>}
      </form>
    </div>
  );
}
