"use client";

import { useStore } from "@/lib/store";
import { FormEvent, useState } from "react";

export function DoctorForm({ onCreated }: { onCreated?: () => void }) {
  const { addDoctor } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("demo123");
  const [clinicId, setClinicId] = useState("");
  const [specialty, setSpecialty] = useState("General physiotherapy");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const created = await addDoctor({ name, email, password, clinicId, specialty, phone, bio });
    if (!created) {
      setOk("");
      setError("That email is already in the clinic directory.");
      return;
    }
    setError("");
    setOk("Doctor added. New bookings for this clinic ID appear on their dashboard immediately.");
    setName("");
    setEmail("");
    setClinicId("");
    setPhone("");
    setBio("");
    onCreated?.();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3 p-6">
      <h2 className="text-xl font-semibold">Add a doctor</h2>
      <label className="block space-y-1">
        <span>Full name</span>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1">
          <span>Email (their login)</span>
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block space-y-1">
          <span>Temporary password</span>
          <input className="field" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1">
          <span>Clinic ID (optional)</span>
          <input className="field" placeholder="DOC-1003" value={clinicId} onChange={(e) => setClinicId(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span>Phone</span>
          <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
      </div>
      <label className="block space-y-1">
        <span>Specialty</span>
        <input className="field" value={specialty} onChange={(e) => setSpecialty(e.target.value)} required />
      </label>
      <label className="block space-y-1">
        <span>Profile note</span>
        <textarea className="field min-h-20" value={bio} onChange={(e) => setBio(e.target.value)} />
      </label>
      {error && <p className="text-rose">{error}</p>}
      {ok && <p className="text-teal-dark">{ok}</p>}
      <button className="btn btn-primary" type="submit">
        Save doctor
      </button>
    </form>
  );
}
