"use client";

import { CONDITIONS } from "@/lib/seed";
import { useStore } from "@/lib/store";

export function Sparkline({ patientId }: { patientId: string }) {
  const { state } = useStore();
  const points = state.painLogs
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
    .slice(-8)
    .map((p) => p.level);
  if (points.length < 2) {
    return <p className="text-muted">Log pain a few times to see your trend.</p>;
  }
  const w = 320;
  const h = 88;
  const max = 10;
  const path = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * (w - 16) + 8;
      const y = h - 12 - (v / max) * (h - 24);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md" role="img" aria-label="Pain trend">
      <path d={path} fill="none" stroke="#0f6e62" strokeWidth="3" strokeLinecap="round" />
      {points.map((v, i) => {
        const x = (i / (points.length - 1)) * (w - 16) + 8;
        const y = h - 12 - (v / max) * (h - 24);
        return <circle key={i} cx={x} cy={y} r="4" fill="#0b534a" />;
      })}
    </svg>
  );
}

export function conditionLabel(id: string) {
  return CONDITIONS.find((c) => c.id === id)?.label ?? id;
}
