"use client";

import { Logo } from "@/components/Logo";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { issueAdminSession } from "@/lib/admin-actions";
import { useCurrentUser, useStore } from "@/lib/store";
import type { User } from "@/lib/types";
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

  const roleHint = params.get("role");

  useEffect(() => {
    if (roleHint === "doctor" || roleHint === "physio") {
      setEmail("james@demo.physio");
    } else if (roleHint === "patient") {
      setEmail("maya@demo.physio");
    }
  }, [roleHint]);

  useEffect(() => {
    if (!hydrated || !user) return;
    let cancelled = false;
    void (async () => {
      const claimed = await issueAdminSession({ email: user.email, userId: user.id });
      if (cancelled) return;
      // Role home by default. Only honor /admin when next asks for it and session is admin.
      // Do not force admin users (e.g. james@demo.physio) away from the doctor portal.
      const next = params.get("next");
      if (next?.startsWith("/admin")) {
        router.replace(claimed.admin ? next : "/unauthorized");
        return;
      }
      const role = user.role;
      // Honor next only when it matches the signed-in role's portal.
      if (next && !next.startsWith("/staff")) {
        if (role === "physio" && (next.startsWith("/doctor") || next.startsWith("/physio"))) {
          router.replace(next);
          return;
        }
        if (role === "patient" && next.startsWith("/patient")) {
          router.replace(next);
          return;
        }
      }
      if (role === "physio") router.replace("/doctor/dashboard");
      else router.replace("/patient/dashboard");
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, user, router, params]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void (async () => {
      const found: User | false = await login(email.trim(), password);
      setError(found ? "" : t("invalid"));
    })();
  }

  async function enter(nextEmail: string) {
    setEmail(nextEmail);
    setPassword("demo123");
    const found = await login(nextEmail, "demo123");
    if (!found) setError("Demo account is not ready yet. Wait a moment and try again.");
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
            <button type="button" className="btn btn-ghost" onClick={() => void enter("maya@demo.physio")}>
              {t("patientPortal")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void enter("james@demo.physio")}>
              {t("doctorJames")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void enter("aisha@demo.physio")}>
              {t("doctorAisha")}
            </button>
          </div>
        </form>
        <p className="text-center text-muted">
          <Link href="/forgot-password">Forgot password?</Link>
        </p>
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
