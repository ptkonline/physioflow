"use client";

import { Logo } from "@/components/Logo";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { syncFirebaseAuth, clearFirebaseAuth } from "@/lib/firebase-auth-session";
import { isFirebaseConfigured } from "@/lib/firebase-config";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function AdminLoginForm() {
  const t = useTranslations("admin");
  const ta = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.get("error") === "env" ? t("envMissing") : "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!isFirebaseConfigured()) {
      setError(ta("firebaseRequired"));
      return;
    }
    setBusy(true);
    try {
      const user = await syncFirebaseAuth(email, password, { createIfMissing: false });
      if (!user) {
        setError(ta("invalid"));
        return;
      }
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const body = (await res.json()) as { error?: string };
      await clearFirebaseAuth();
      if (!res.ok) {
        setError(body.error || t("denied"));
        return;
      }
      const next = params.get("next");
      router.replace(next?.startsWith("/admin") && next !== "/admin/login" ? next : "/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : ta("invalid"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <Logo className="text-xl" />
        <LocaleSwitcher />
        <form onSubmit={(event) => void onSubmit(event)} className="card space-y-4 p-5 sm:p-6">
          <p className="chip">{t("badge")}</p>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-muted">{t("subtitle")}</p>
          <label className="block space-y-1">
            <span>{ta("email")}</span>
            <input className="field" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block space-y-1">
            <span>{ta("password")}</span>
            <input className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="text-rose">{error}</p>}
          <button className="btn btn-primary w-full" type="submit" disabled={busy}>
            {busy ? t("checking") : t("submit")}
          </button>
        </form>
        <p className="text-center text-sm text-muted">
          <Link href="/login">{t("patientDoctorLogin")}</Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
