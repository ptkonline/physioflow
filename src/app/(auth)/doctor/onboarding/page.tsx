"use client";

import { Logo } from "@/components/Logo";
import { compressImage, fileToDataUrl } from "@/lib/image";
import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function DoctorOnboardingPage() {
  const { user } = useCurrentUser();
  const { hydrated, state, updateDoctor } = useStore();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const doctor = user ? state.doctors.find((d) => d.userId === user.id) : undefined;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !doctor) return;
    const input = e.currentTarget.elements.namedItem("photo") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const photo = await compressImage(file);
      const photoUrl = await fileToDataUrl(photo);
      updateDoctor({ ...doctor, photoUrl });
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) return <p className="p-8">Loading…</p>;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Link href="/" className="no-underline">
        <Logo className="text-xl" />
      </Link>
      <div className="card mt-6 space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Doctor onboarding</h1>
        {!user || user.role !== "physio" ? (
          <>
            <p className="text-muted">
              New doctor applications stay on this public path so the role proxy does not bounce you to login
              mid-flow. After verification, sign in and add the photo patients see on Browse Doctors.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/register?role=doctor" className="btn btn-primary no-underline">
                Apply as a doctor
              </Link>
              <Link href="/login" className="btn btn-ghost no-underline">
                Sign in
              </Link>
            </div>
          </>
        ) : (
          <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
            <p className="text-muted">Welcome, {user.name}. Add a clinic photo for your listing.</p>
            <label className="block space-y-1">
              <span>Profile photo</span>
              <input className="field" name="photo" type="file" accept="image/*" required />
            </label>
            <button className="btn btn-primary" type="submit" disabled={busy || !doctor}>
              {busy ? "Saving…" : "Save photo"}
            </button>
            {done && (
              <p className="text-teal-dark">
                Saved.{" "}
                <Link href="/doctor/dashboard" className="underline">
                  Go to dashboard
                </Link>
              </p>
            )}
            {!doctor && <p className="text-rose">No doctor profile is linked to this account yet.</p>}
          </form>
        )}
      </div>
    </div>
  );
}
