"use client";

import { CONDITIONS } from "@/lib/seed";
import type { Exercise } from "@/lib/types";
import { Clock, Play } from "lucide-react";
import Link from "next/link";

export function ExerciseCard({
  exercise,
  href,
  meta,
}: {
  exercise: Exercise;
  href?: string;
  meta?: string;
}) {
  const label = CONDITIONS.find((c) => c.id === exercise.condition)?.label;
  const inner = (
    <article className="card overflow-hidden">
      <div className="relative h-40 bg-sand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={exercise.thumbnail}
          alt=""
          className="h-full w-full object-cover"
        />
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-sm text-white">
          <Play size={14} /> Watch
        </span>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap gap-2">
          <span className="chip">{label}</span>
          <span className="chip bg-sand text-ink">{exercise.difficulty}</span>
        </div>
        <h3 className="text-lg font-semibold">{exercise.name}</h3>
        <p className="text-muted">{exercise.description}</p>
        <p className="flex items-center gap-1 text-sm text-muted">
          <Clock size={16} /> {exercise.durationMin} min
          {meta ? ` · ${meta}` : ""}
        </p>
      </div>
    </article>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="block no-underline transition hover:-translate-y-0.5">
      {inner}
    </Link>
  );
}
