"use client";

import { adminAuthorize, adminDeleteUser } from "@/lib/admin-actions";
import { useStore } from "@/lib/store";
import { useState } from "react";

const EMPTY_NEW = { name: "", email: "", phone: "" };

export function AdminPatients() {
  const { state, hydrated, addPatient, updateUser, deleteAccount } = useStore();
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_NEW);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", email: "", phone: "" });
  const [historyId, setHistoryId] = useState<string | null>(null);

  if (!hydrated) return <p className="text-muted">Loading patients…</p>;

  const term = q.trim().toLowerCase();
  const patients = state.users
    .filter((u) => u.role === "patient")
    .filter((u) => (term ? u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) : true));
  const doctorName = (id: string) => state.users.find((u) => u.id === id)?.name ?? id;

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
    const ok = addPatient({ name: form.name, email: form.email, phone: form.phone });
    if (!ok) {
      setNote("That email is already in use.");
      return;
    }
    setForm(EMPTY_NEW);
    setAdding(false);
    setNote("Patient added.");
  }

  function startEdit(userId: string) {
    const u = state.users.find((x) => x.id === userId);
    setEditId(userId);
    setDraft({ name: u?.name ?? "", email: u?.email ?? "", phone: u?.phone ?? "" });
  }

  async function saveEdit(userId: string) {
    if (!(await guard())) return;
    updateUser(userId, { name: draft.name, email: draft.email, phone: draft.phone });
    setEditId(null);
    setNote("Patient updated.");
  }

  async function remove(userId: string) {
    const res = await adminDeleteUser(userId);
    if (!res.ok) {
      setNote("Delete blocked — you are not the configured admin.");
      return;
    }
    deleteAccount(res.userId);
    setNote("Patient deleted.");
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-muted">Manage patients</p>
          <h1 className="text-3xl font-semibold">Patients</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setAdding((v) => !v)}>
          {adding ? "Close" : "Add patient"}
        </button>
      </header>
      {note && <p className="text-sm text-teal">{note}</p>}

      {adding && (
        <div className="card space-y-3 p-5">
          <h2 className="font-semibold">New patient</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input className="field" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="field" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <button type="button" className="btn btn-primary" onClick={() => void onAdd()}>
            Create patient
          </button>
        </div>
      )}

      <input className="field max-w-xs" placeholder="Search patients" value={q} onChange={(e) => setQ(e.target.value)} />

      <ul className="space-y-3">
        {patients.map((u) => {
          const editing = editId === u.id;
          const showing = historyId === u.id;
          const history = (state.bookings ?? [])
            .filter((b) => b.patientId === u.id)
            .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
          return (
            <li key={u.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-muted">
                    {u.email}
                    {u.phone ? ` · ${u.phone}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn btn-ghost px-3 py-1" onClick={() => setHistoryId(showing ? null : u.id)}>
                    {showing ? "Hide history" : `History (${history.length})`}
                  </button>
                  <button type="button" className="btn btn-ghost px-3 py-1" onClick={() => (editing ? setEditId(null) : startEdit(u.id))}>
                    {editing ? "Cancel" : "Edit"}
                  </button>
                  <button type="button" className="btn btn-ghost px-3 py-1 text-rose" onClick={() => void remove(u.id)}>
                    Delete
                  </button>
                </div>
              </div>

              {editing && (
                <div className="mt-4 grid gap-3 border-t border-line pt-4 md:grid-cols-3">
                  <label className="block space-y-1">
                    <span className="text-sm">Name</span>
                    <input className="field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm">Email</span>
                    <input className="field" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm">Phone</span>
                    <input className="field" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                  </label>
                  <div className="md:col-span-3">
                    <button type="button" className="btn btn-primary" onClick={() => void saveEdit(u.id)}>
                      Save changes
                    </button>
                  </div>
                </div>
              )}

              {showing && (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="mb-2 text-sm font-medium">Booking history</p>
                  {history.length === 0 ? (
                    <p className="text-sm text-muted">No bookings yet.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {history.map((b) => (
                        <li key={b.id} className="flex flex-wrap justify-between gap-2">
                          <span>
                            {new Date(b.scheduledAt).toLocaleString()} · {b.reason}
                          </span>
                          <span className="text-muted">
                            {doctorName(b.physioId)} · {b.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
