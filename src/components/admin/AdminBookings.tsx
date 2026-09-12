"use client";

import { adminAuthorize } from "@/lib/admin-actions";
import { useStore } from "@/lib/store";
import type { Booking } from "@/lib/types";
import { useMemo, useState } from "react";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUSES: Booking["status"][] = ["upcoming", "completed", "cancelled"];

export function AdminBookings() {
  const { state, hydrated, reassignBooking, rescheduleBooking, setBookingStatus } = useStore();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Booking["status"]>("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  const actorId = state.currentUserId ?? "admin";
  const doctors = useMemo(() => state.users.filter((u) => u.role === "physio"), [state.users]);
  const doctorName = (id: string) => state.users.find((u) => u.id === id)?.name ?? id;

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...(state.bookings ?? [])]
      .filter((b) => (statusFilter === "all" ? true : b.status === statusFilter))
      .filter((b) =>
        term
          ? b.patientName.toLowerCase().includes(term) ||
            b.patientEmail.toLowerCase().includes(term) ||
            doctorName(b.physioId).toLowerCase().includes(term)
          : true,
      )
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.bookings, state.users, q, statusFilter]);

  async function guard() {
    const res = await adminAuthorize();
    if (!res.ok) {
      setNote("Action blocked — you are not the configured admin.");
      return false;
    }
    setNote("");
    return true;
  }

  async function onReassign(id: string, physioId: string) {
    if (!(await guard())) return;
    reassignBooking(id, physioId, actorId);
    setNote("Booking reassigned.");
  }

  async function onStatus(id: string, status: Booking["status"]) {
    if (!(await guard())) return;
    setBookingStatus(id, status);
    setNote(`Status updated to ${status}.`);
  }

  async function onReschedule(id: string) {
    const value = drafts[id];
    if (!value) return;
    if (!(await guard())) return;
    const ok = await rescheduleBooking(id, new Date(value).toISOString());
    setNote(ok ? "Appointment rescheduled." : "Could not reschedule (only upcoming bookings, and the slot must be free).");
  }

  if (!hydrated) return <p className="text-muted">Loading bookings…</p>;

  return (
    <div className="space-y-4">
      <header>
        <p className="text-muted">All appointments across every doctor</p>
        <h1 className="text-3xl font-semibold">Bookings</h1>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="field max-w-xs"
          placeholder="Search patient, email, or doctor"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="field max-w-[10rem]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted">{rows.length} booking(s)</span>
      </div>
      {note && <p className="text-sm text-teal">{note}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Doctor</th>
              <th className="px-4 py-3 font-medium">Date &amp; time</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{b.patientName}</p>
                  <p className="text-xs text-muted">{b.reason}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="field py-1"
                    value={b.physioId}
                    onChange={(e) => void onReassign(b.id, e.target.value)}
                    aria-label={`Doctor for ${b.patientName}`}
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      className="field py-1"
                      value={drafts[b.id] ?? toLocalInput(b.scheduledAt)}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [b.id]: e.target.value }))}
                      aria-label={`Time for ${b.patientName}`}
                    />
                    <button type="button" className="btn btn-ghost px-2 py-1" onClick={() => void onReschedule(b.id)}>
                      Save
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="field py-1"
                    value={b.status}
                    onChange={(e) => void onStatus(b.id, e.target.value as Booking["status"])}
                    aria-label={`Status for ${b.patientName}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-ghost px-2 py-1 text-rose"
                    disabled={b.status === "cancelled"}
                    onClick={() => void onStatus(b.id, "cancelled")}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No bookings match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
