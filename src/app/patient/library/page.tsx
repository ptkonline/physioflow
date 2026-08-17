"use client";

import { ExerciseCard } from "@/components/ExerciseCard";
import { CONDITIONS } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { Condition } from "@/lib/types";
import { useMemo, useState } from "react";

export default function PatientLibrary() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [condition, setCondition] = useState<Condition | "all">("all");
  const list = useMemo(
    () =>
      state.exercises.filter((e) => {
        const q = query.toLowerCase();
        const matchQ = e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
        const matchC = condition === "all" || e.condition === condition;
        return matchQ && matchC;
      }),
    [state.exercises, query, condition],
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">Exercise library</h1>
        <p className="text-muted">Short videos and plain-language steps, grouped by condition.</p>
      </header>
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          className="field"
          placeholder="Search exercises"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="field md:max-w-xs" value={condition} onChange={(e) => setCondition(e.target.value as Condition | "all")}>
          <option value="all">All conditions</option>
          {CONDITIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} href={`/patient/exercise/${exercise.id}`} />
        ))}
      </div>
    </div>
  );
}
