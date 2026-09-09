"use client";

import { Logo } from "@/components/Logo";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { isFirebaseConfigured } from "@/lib/firebase-config";
import { requestPasswordReset } from "@/lib/firebase-auth-session";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!isFirebaseConfigured()) {
        throw new Error("Password reset needs Firebase Auth. Add NEXT_PUBLIC_FIREBASE_* in .env.local.");
      }
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="no-underline">
          <Logo className="text-xl" />
        </Link>
        <LocaleSwitcher />
        <form onSubmit={(e) => void onSubmit(e)} className="card space-y-4 p-6">
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="text-muted">We will email a Firebase reset link to this address.</p>
          {sent ? (
            <p>Check {email} for the reset link. Then sign in with the new password.</p>
          ) : (
            <>
              <label className="block space-y-1">
                <span>Email</span>
                <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              {error && <p className="text-rose">{error}</p>}
              <button className="btn btn-primary w-full" type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send reset email"}
              </button>
            </>
          )}
        </form>
        <p className="text-center text-muted">
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
