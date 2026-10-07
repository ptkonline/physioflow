"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type DirectoryUser = { id: string; name: string; email: string; role: string; uhid?: string };
type DirectoryDoctor = { id: string; email: string; specialty: string; isVerified: boolean; uhid?: string };

export function AdminDashboard() {
  const t = useTranslations("account");
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [doctors, setDoctors] = useState<DirectoryDoctor[]>([]);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/directory");
    const body = (await res.json()) as {
      error?: string;
      warning?: string;
      users?: DirectoryUser[];
      doctors?: DirectoryDoctor[];
    };
    if (!res.ok) {
      setError(body.error || "Could not load the directory.");
      return;
    }
    setUsers(body.users ?? []);
    setDoctors(body.doctors ?? []);
    setWarning(body.warning ?? "");
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/directory")
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }: { ok: boolean; body: { error?: string; warning?: string; users?: DirectoryUser[]; doctors?: DirectoryDoctor[] } }) => {
        if (cancelled) return;
        if (!ok) {
          setError(body.error || "Could not load the directory.");
          return;
        }
        setUsers(body.users ?? []);
        setDoctors(body.doctors ?? []);
        setWarning(body.warning ?? "");
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the directory.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function act(action: "delete" | "verify", userId: string, isVerified?: boolean) {
    setError("");
    setBusyId(userId);
    try {
      const res = await fetch("/api/admin/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId, isVerified }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error || "That change was blocked.");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const patients = users.filter((user) => user.role === "patient");
  const clinicianUsers = users.filter((user) => user.role === "physio");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-muted">Clinic admin</p>
        <h1 className="text-3xl font-semibold">People</h1>
        <p className="mt-1 text-muted">Accounts come from UAT Firestore. This console does not use the patient or doctor sign-in.</p>
      </header>
      {warning && <p className="text-amber">{warning}</p>}
      {error && <p className="text-rose">{error}</p>}

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-xl font-semibold">Patients</h2>
        </div>
        <ul className="divide-y divide-line">
          {patients.length === 0 && <li className="px-5 py-4 text-muted">No patient profiles yet.</li>}
          {patients.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-semibold">{user.name || user.email}</p>
                <p className="text-sm text-muted">{user.email}</p>
                <p className="text-sm text-muted">{t("uhid")} {user.uhid || "—"}</p>
              </div>
              <button type="button" className="btn btn-ghost" disabled={busyId === user.id} onClick={() => void act("delete", user.id)}>
                Remove
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
          {clinicianUsers.length === 0 && <li className="px-5 py-4 text-muted">No doctor profiles yet.</li>}
          {clinicianUsers.map((user) => {
            const profile = doctors.find((doctor) => doctor.id === user.id || doctor.email === user.email);
            const verified = Boolean(profile?.isVerified);
            return (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-semibold">{user.name || user.email}</p>
                  <p className="text-sm text-muted">
                    {user.email}
                    {profile?.specialty ? ` · ${profile.specialty}` : ""}
                    {verified ? " · verified" : " · pending"}
                    {" · "}
                    {t("uhid")} {user.uhid || profile?.uhid || "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busyId === user.id}
                    onClick={() => void act("verify", user.id, !verified)}
                  >
                    {verified ? "Unverify" : "Verify"}
                  </button>
                  <button type="button" className="btn btn-ghost" disabled={busyId === user.id} onClick={() => void act("delete", user.id)}>
                    Remove
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
