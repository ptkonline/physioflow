"use client";

import { adminAuthorize, adminDeleteUser, adminSetDoctorVerified } from "@/lib/admin-actions";
import { useStore } from "@/lib/store";
import { DEFAULT_HOURS, type DoctorProfile } from "@/lib/types";
import { useState } from "react";

const DAYS = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 0, label: "Sun" },
];

const EMPTY_NEW = { name: "", email: "", phone: "", specialty: "General physiotherapy", password: "physio123", clinicId: "" };

export function AdminDoctors() {
  const { state, hydrated, addDoctor, updateUser, updateDoctor, setDoctorActive, deleteAccount } = useStore();
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_NEW);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; phone: string; specialty: string; hours: DoctorProfile["availability"] } | null>(null);

  if (!hydrated) return <p className="text-muted">Loading doctors…</p>;

  const doctors = state.users.filter((u) => u.role === "physio");

  async function guard() {
    const res = await adminAuthorize();
    if (!res.ok) {
      setNote("Action blocked — you are not the configured admin.");
      return false;
    }
    setNote("");
    return true;
  }

  async function onAdd() {
    if (!form.name.trim() || !form.email.includes("@")) {
      setNote("Enter a name and valid email.");
      return;
    }
    if (!(await guard())) return;
    const ok = await addDoctor({
      name: form.name,
      email: form.email,
      password: form.password || "physio123",
      clinicId: form.clinicId,
      specialty: form.specialty,
      phone: form.phone,
      bio: "",
    });
    if (!ok) {
      setNote("That email is already in use.");
      return;
    }
    setForm(EMPTY_NEW);
    setAdding(false);
    setNote("Doctor added.");
  }

  function startEdit(userId: string) {
    const u = state.users.find((x) => x.id === userId);
    const p = state.doctors.find((d) => d.userId === userId);
    setEditId(userId);
    setDraft({
      name: u?.name ?? "",
      phone: p?.phone ?? u?.phone ?? "",
      specialty: p?.specialty ?? "",
      hours: p?.availability ?? DEFAULT_HOURS,
    });
  }

  async function saveEdit(userId: string) {
    if (!draft) return;
    if (!(await guard())) return;
    updateUser(userId, { name: draft.name, phone: draft.phone });
    const p = state.doctors.find((d) => d.userId === userId);
    if (p) {
      updateDoctor({ ...p, specialty: draft.specialty, phone: draft.phone, availability: draft.hours });
    }
    setEditId(null);
    setDraft(null);
    setNote("Doctor updated.");
  }

  async function toggleActive(userId: string, active: boolean) {
    if (!(await guard())) return;
    setDoctorActive(userId, active);
    setNote(active ? "Doctor reactivated." : "Doctor deactivated (hidden from patient booking).");
  }

  async function toggleVerify(userId: string, isVerified: boolean) {
    const res = await adminSetDoctorVerified(userId, isVerified);
    if (!res.ok) {
      setNote("Action blocked — you are not the configured admin.");
      return;
    }
    const p = state.doctors.find((d) => d.userId === userId);
    if (p) updateDoctor({ ...p, isVerified: res.isVerified });
    setNote("");
  }

  async function remove(userId: string) {
    const res = await adminDeleteUser(userId);
    if (!res.ok) {
      setNote("Delete blocked — you are not the configured admin.");
      return;
    }
    deleteAccount(res.userId);
    setNote("Doctor deleted.");
  }

  function toggleDay(id: number) {
    if (!draft) return;
    const days = draft.hours.days.includes(id)
      ? draft.hours.days.filter((d) => d !== id)
      : [...draft.hours.days, id].sort();
    setDraft({ ...draft, hours: { ...draft.hours, days } });
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-muted">Manage clinicians</p>
          <h1 className="text-3xl font-semibold">Doctors</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setAdding((v) => !v)}>
          {adding ? "Close" : "Add doctor"}
        </button>
      </header>
      {note && <p className="text-sm text-teal">{note}</p>}

      {adding && (
        <div className="card space-y-3 p-5">
          <h2 className="font-semibold">New doctor</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="field" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="field" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="field" placeholder="Specialization" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
            <input className="field" placeholder="Clinic ID (optional)" value={form.clinicId} onChange={(e) => setForm({ ...form, clinicId: e.target.value })} />
            <input className="field" placeholder="Temp password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="button" className="btn btn-primary" onClick={() => void onAdd()}>
            Create doctor
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {doctors.map((u) => {
          const p = state.doctors.find((d) => d.userId === u.id);
          const active = p ? p.active !== false : true;
          const editing = editId === u.id;
          return (
            <li key={u.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {u.name}{" "}
                    {!active && <span className="chip bg-rose/15 text-rose">Deactivated</span>}{" "}
                    {p?.isVerified ? <span className="chip bg-sage text-teal-dark">Verified</span> : <span className="chip">Pending</span>}
                  </p>
                  <p className="text-sm text-muted">
                    {u.email} · {p?.specialty ?? "—"} · {p?.clinicId ?? u.id}
                  </p>
                  {p && (
                    <p className="text-xs text-muted">
                      Hours: {p.availability.days.map((d) => DAYS.find((x) => x.id === d)?.label).join(", ") || "none"} ·{" "}
                      {p.availability.startHour}:00–{p.availability.endHour}:00
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-ghost px-3 py-1" onClick={() => (editing ? setEditId(null) : startEdit(u.id))}>
                    {editing ? "Cancel" : "Edit"}
                  </button>
                  <button type="button" className="btn btn-ghost px-3 py-1" onClick={() => void toggleVerify(u.id, !p?.isVerified)}>
                    {p?.isVerified ? "Unverify" : "Verify"}
                  </button>
                  <button type="button" className="btn btn-ghost px-3 py-1" onClick={() => void toggleActive(u.id, !active)}>
                    {active ? "Deactivate" : "Activate"}
                  </button>
                  <button type="button" className="btn btn-ghost px-3 py-1 text-rose" onClick={() => void remove(u.id)}>
                    Delete
                  </button>
                </div>
              </div>

              {editing && draft && (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="block space-y-1">
                      <span className="text-sm">Name</span>
                      <input className="field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-sm">Phone</span>
                      <input className="field" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-sm">Specialization</span>
                      <input className="field" value={draft.specialty} onChange={(e) => setDraft({ ...draft, specialty: e.target.value })} />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Working days</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {DAYS.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className={`btn px-3 py-1 ${draft.hours.days.includes(d.id) ? "btn-primary" : "btn-ghost"}`}
                          onClick={() => toggleDay(d.id)}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="block space-y-1">
                      <span className="text-sm">Start hour</span>
                      <input type="number" min={6} max={21} className="field" value={draft.hours.startHour} onChange={(e) => setDraft({ ...draft, hours: { ...draft.hours, startHour: Number(e.target.value) } })} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-sm">End hour</span>
                      <input type="number" min={7} max={22} className="field" value={draft.hours.endHour} onChange={(e) => setDraft({ ...draft, hours: { ...draft.hours, endHour: Number(e.target.value) } })} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-sm">Slot (min)</span>
                      <input type="number" min={10} max={120} step={5} className="field" value={draft.hours.slotMin} onChange={(e) => setDraft({ ...draft, hours: { ...draft.hours, slotMin: Number(e.target.value) } })} />
                    </label>
                  </div>
                  <button type="button" className="btn btn-primary" onClick={() => void saveEdit(u.id)}>
                    Save changes
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
