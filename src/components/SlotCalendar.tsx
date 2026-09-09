"use client";

import { formatSlot, openSlots } from "@/lib/availability";
import type { AppState } from "@/lib/types";
import { useMemo } from "react";

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
}

export function SlotCalendar({
  physioId,
  state,
  value,
  onChange,
  modeLabel,
}: {
  physioId: string;
  state: AppState;
  value: string;
  onChange: (iso: string) => void;
  modeLabel?: string;
}) {
  const slots = useMemo(() => openSlots(physioId, state, 14), [physioId, state]);
  const groups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const iso of slots) {
      const key = dayKey(iso);
      const list = map.get(key) ?? [];
      list.push(iso);
      map.set(key, list);
    }
    return [...map.entries()].slice(0, 7);
  }, [slots]);

  if (slots.length === 0) {
    return <p className="text-muted">No open slots in the next two weeks.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="font-medium">Available slots</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(([key, hours]) => (
          <article key={key} className="rounded-2xl bg-white p-3 ring-1 ring-line">
            <p className="text-sm font-semibold">{dayLabel(hours[0])}</p>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {hours.map((iso) => (
                <button
                  key={iso}
                  type="button"
                  className={`rounded-xl px-2 py-1 text-xs ${value === iso ? "bg-teal text-white" : "bg-cream text-ink"}`}
                  onClick={() => onChange(iso)}
                >
                  {new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      {value ? (
        <p className="text-sm text-muted">
          Selected{modeLabel ? ` · ${modeLabel}` : ""}: {formatSlot(value)}
        </p>
      ) : (
        <p className="text-sm text-muted">Tap a time on the calendar to book.</p>
      )}
    </div>
  );
}
