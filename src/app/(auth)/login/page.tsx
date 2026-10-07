"use client";

import { Logo } from "@/components/Logo";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { isFirebaseConfigured } from "@/lib/firebase-config";
import { homePath } from "@/lib/paths";
import { useCurrentUser, useStore } from "@/lib/store";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

function LoginForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const { login, hydrated } = useStore();
  const { user } = useCurrentUser();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hydrated || !user) return;
    const next = params.get("next");
    if (next && !next.startsWith("/admin") && !next.startsWith("/staff")) {
      if (user.role === "physio" && (next.startsWith("/doctor") || next.startsWith("/physio"))) {
        router.replace(next);
        return;
      }
      if (user.role === "patient" && next.startsWith("/patient")) {
        router.replace(next);
        return;
      }
    }
    router.replace(homePath(user.role));
  }, [hydrated, user, router, params]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isFirebaseConfigured()) {
      setError(t("firebaseRequired"));
      return;
    }
    setBusy(true);
    const found = await login(email.trim(), password);
    setBusy(false);
    setError(found ? "" : t("invalid"));
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-5">
        <Link href="/" className="no-underline">
          <Logo className="text-xl" />
        </Link>
        <LocaleSwitcher />
        <form onSubmit={(event) => void onSubmit(event)} className="card space-y-4 p-5 sm:p-6">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-muted">{t("passwordOnly")}</p>
          <label className="block space-y-1">
            <span>{t("email")}</span>
            <input className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block space-y-1">
            <span>{t("password")}</span>
            <input className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="text-rose">{error}</p>}
          <button className="btn btn-primary w-full" type="submit" disabled={busy}>
            {busy ? tc("loading") : tc("continue")}
          </button>
        </form>
        <p className="text-center text-muted">
          <Link href="/forgot-password">{t("forgotPassword")}</Link>
        </p>
        <p className="text-center text-muted">
          {t("newHere")} <Link href="/register">{t("createAccount")}</Link>
        </p>
        <p className="text-center text-sm text-muted">
          <Link href="/admin/login">{t("adminLink")}</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
