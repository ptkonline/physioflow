"use client";

import { adminDeleteUser, adminSetDoctorVerified } from "@/lib/admin-actions";
import { useCurrentUser, useStore } from "@/lib/store";
import { useState } from "react";

export function AdminDashboard() {
  const { user: actor } = useCurrentUser();
  const { state, deleteAccount, updateDoctor, hydrated } = useStore();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!hydrated) return <p className="text-muted">Loading accounts…</p>;

  const patients = state.users.filter((u) => u.role === "patient");
  const doctors = state.users.filter((u) => u.role === "physio");

  async function removeUser(userId: string) {
    setError("");
    setBusyId(userId);
    try {
      const result = await adminDeleteUser(userId);
      if (!result.ok) {
        setError("Delete blocked. You are not the configured admin.");
        return;
      }
      deleteAccount(result.userId);
    } catch {
      setError("Delete blocked. You are not the configured admin.");
    } finally {
      setBusyId(null);
    }
  }

  async function setVerified(doctorId: string, isVerified: boolean) {
    setError("");
    setBusyId(doctorId);
    try {
      const result = await adminSetDoctorVerified(doctorId, isVerified);
      if (!result.ok) {
        setError("Verification change blocked. You are not the configured admin.");
        return;
      }
      const doctor = state.doctors.find((d) => d.userId === result.doctorId);
      if (doctor) updateDoctor({ ...doctor, isVerified: result.isVerified });
    } catch {
      setError("Verification change blocked. You are not the configured admin.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-muted">Platform administration</p>
        <h1 className="text-3xl font-semibold">Users</h1>
        <p className="mt-1 text-muted">
          Delete demo accounts and verify clinicians. Every action is re-checked on the server against{" "}
          <code>ADMIN_UID</code> before it runs.
        </p>
      </header>
      {error && <p className="text-rose">{error}</p>}

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-xl font-semibold">Patients</h2>
        </div>
        <ul className="divide-y divide-line">
          {patients.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-muted">
                  {u.email} · {u.id}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busyId === u.id || u.id === actor?.id}
                onClick={() => void removeUser(u.id)}
              >
                Delete user
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-xl font-semibold">Doctors</h2>
        </div>
        <ul className="divide-y divide-line">
          {doctors.map((u) => {
            const profile = state.doctors.find((d) => d.userId === u.id);
            const verified = Boolean(profile?.isVerified);
            return (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-muted">
                    {u.email} · {u.id}
                    {verified ? " · verified" : " · pending"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={verified}
                      disabled={!profile || busyId === u.id}
                      onChange={(e) => void setVerified(u.id, e.target.checked)}
                    />
                    Verify doctor
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busyId === u.id || u.id === actor?.id}
                    onClick={() => void removeUser(u.id)}
                  >
                    Delete user
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
