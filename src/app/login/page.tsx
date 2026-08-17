"use client";

import { Logo } from "@/components/Logo";
import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

function LoginForm() {
  const { login } = useStore();
  const { user } = useCurrentUser();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("maya@demo.physio");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const next = params.get("next");
    router.replace(next || (user.role === "physio" ? "/physio" : "/patient"));
  }, [user, router, params]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = login(email, password);
    setError(ok ? "" : "Email or password is not correct.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="no-underline">
          <Logo className="text-xl" />
        </Link>
        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-muted">Use your email. Large fields, no rush.</p>
          <label className="block space-y-1">
            <span>Email</span>
            <input className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block space-y-1">
            <span>Password</span>
            <input className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <p className="text-rose">{error}</p>}
          <button className="btn btn-primary w-full" type="submit">
            Continue
          </button>
          <div className="flex flex-col gap-2 text-sm">
            <button type="button" className="btn btn-ghost" onClick={() => { setEmail("maya@demo.physio"); setPassword("demo123"); }}>
              Patient demo
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { setEmail("james@demo.physio"); setPassword("demo123"); }}>
              Clinician demo
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
