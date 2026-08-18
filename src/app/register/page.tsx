"use client";

import { Logo } from "@/components/Logo";
import { CONDITIONS, GOALS } from "@/lib/seed";
import { homePath } from "@/lib/paths";
import { useStore } from "@/lib/store";
import type { Condition, Role } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const { register } = useStore();
  const router = useRouter();
  const [role, setRole] = useState<Role>("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [condition, setCondition] = useState<Condition>("knee");
  const [goal, setGoal] = useState(GOALS[0]);
  const [hipaa, setHipaa] = useState(false);
  const [gdpr, setGdpr] = useState(false);
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hipaa || !gdpr) {
      setError("Please accept both privacy statements to continue.");
      return;
    }
    const ok = register({ name, email, password, role, condition, goal });
    if (!ok) {
      setError("That email is already in use.");
      return;
    }
    router.replace(homePath(role));
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link href="/" className="no-underline">
        <Logo className="text-xl" />
      </Link>
      <form onSubmit={onSubmit} className="card mt-6 space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-muted">Tell us who you are. You can change details later.</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(["patient", "physio", "staff"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`btn ${role === r ? "btn-primary" : "btn-ghost"}`}
            >
              {r === "patient" ? "Patient" : r === "physio" ? "Doctor" : "Front desk"}
            </button>
          ))}
        </div>
        <label className="block space-y-1">
          <span>Full name</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block space-y-1">
          <span>Email</span>
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block space-y-1">
          <span>Password</span>
          <input className="field" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {role === "patient" && (
          <>
            <label className="block space-y-1">
              <span>Main condition</span>
              <select className="field" value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
                {CONDITIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span>Recovery goal</span>
              <select className="field" value={goal} onChange={(e) => setGoal(e.target.value)}>
                {GOALS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
          </>
        )}
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-5 w-5" checked={hipaa} onChange={(e) => setHipaa(e.target.checked)} />
          <span>I agree to the handling of health information for care (HIPAA-minded consent).</span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 h-5 w-5" checked={gdpr} onChange={(e) => setGdpr(e.target.checked)} />
          <span>I agree to GDPR-style processing and understand I can export or delete my data.</span>
        </label>
        {error && <p className="text-rose">{error}</p>}
        <button className="btn btn-primary w-full" type="submit">
          Create account
        </button>
        <p className="text-center text-muted">
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
