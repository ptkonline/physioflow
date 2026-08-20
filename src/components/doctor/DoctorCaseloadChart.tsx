"use client";

import { conditionLabel } from "@/components/Sparkline";
import { useStore } from "@/lib/store";

export function DoctorCaseloadChart({ physioId }: { physioId: string }) {
  const { state } = useStore();
  const counts = state.profiles
    .filter((p) => p.assignedPhysioId === physioId)
    .reduce<Record<string, number>>((acc, p) => {
      acc[p.condition] = (acc[p.condition] ?? 0) + 1;
      return acc;
    }, {});
  const rows = Object.entries(counts);
  if (!rows.length) return <p className="text-muted">No caseload chart yet.</p>;
  const max = Math.max(...rows.map(([, n]) => n));

  return (
    <article className="card p-5">
      <h2 className="text-xl font-semibold">Caseload mix</h2>
      <ul className="mt-4 space-y-2">
        {rows.map(([condition, n]) => (
          <li key={condition}>
            <p className="text-sm text-muted">
              {conditionLabel(condition)} · {n}
            </p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-sage">
              <div className="h-full bg-teal" style={{ width: `${(n / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
