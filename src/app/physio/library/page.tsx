"use client";

import { CONDITIONS } from "@/lib/seed";
import { conditionLabel } from "@/components/Sparkline";
import { useStore } from "@/lib/store";
import type { Condition } from "@/lib/types";
import { useMemo, useState } from "react";

export default function PhysioLibraryPage() {
  const { state } = useStore();
  const [filter, setFilter] = useState<Condition | "all">("all");
  const list = useMemo(
    () => state.exercises.filter((e) => filter === "all" || e.condition === filter),
    [filter, state.exercises],
  );
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Exercise library</h1>
      <p className="text-muted">Use these clips when you build a program.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full px-4 py-2 ring-1 ${filter === "all" ? "bg-teal text-white ring-teal" : "bg-elev ring-line"}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {CONDITIONS.map((c) => (
          <button
            type="button"
            key={c.id}
            className={`rounded-full px-4 py-2 ring-1 ${filter === c.id ? "bg-teal text-white ring-teal" : "bg-elev ring-line"}`}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {list.map((ex) => (
          <li key={ex.id} className="card p-5">
            <p className="text-sm text-teal">{conditionLabel(ex.condition)}</p>
            <h2 className="mt-1 text-xl font-medium">{ex.name}</h2>
            <p className="mt-2 text-muted">{ex.description}</p>
            <p className="mt-2 text-sm text-muted">
              {ex.durationMin} min · {ex.difficulty}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
