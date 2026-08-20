"use client";

import { Logo } from "@/components/Logo";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
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
  const [email, setEmail] = useState("maya@demo.physio");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hydrated || !user) return;
    const next = params.get("next");
    const dest = next && !next.startsWith("/staff") ? next : homePath(user.role);
    if (user.role === "physio" && dest.startsWith("/patient")) {
      router.replace("/doctor/dashboard");
      return;
    }
    if (user.role === "patient" && (dest.startsWith("/physio") || dest.startsWith("/doctor"))) {
      router.replace("/patient/dashboard");
      return;
    }
    router.replace(dest || homePath(user.role));
  }, [hydrated, user, router, params]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = login(email.trim(), password);
    setError(ok ? "" : t("invalid"));
  }

  function enter(nextEmail: string) {
    setEmail(nextEmail);
    setPassword("demo123");
    const ok = login(nextEmail, "demo123");
    if (!ok) setError("Demo account is not ready yet. Wait a moment and try again.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="no-underline">
          <Logo className="text-xl" />
        </Link>
        <LocaleSwitcher />
        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-muted">{t("subtitle")}</p>
          <label className="block space-y-1">
            <span>{t("email")}</span>
            <input className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block space-y-1">
            <span>{t("password")}</span>
            <input className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="text-rose">{error}</p>}
          <button className="btn btn-primary w-full" type="submit">
            {tc("continue")}
          </button>
          <div className="flex flex-col gap-2 text-sm">
            <button type="button" className="btn btn-ghost" onClick={() => enter("maya@demo.physio")}>
              {t("patientPortal")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => enter("james@demo.physio")}>
              {t("doctorJames")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => enter("aisha@demo.physio")}>
              {t("doctorAisha")}
            </button>
          </div>
        </form>
        <p className="text-center text-muted">
          New here? <Link href="/register">Create an account</Link>
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
