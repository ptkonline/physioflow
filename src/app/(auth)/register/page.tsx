"use client";

import { DoctorRegisterForm } from "@/components/DoctorRegisterForm";
import { Logo } from "@/components/Logo";
import { OtpChallenge } from "@/components/OtpChallenge";
import { CONDITIONS, GOALS } from "@/lib/seed";
import { homePath } from "@/lib/paths";
import { useStore } from "@/lib/store";
import { useOtp } from "@/lib/use-otp";
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
  const [phone, setPhone] = useState("");
  const [condition, setCondition] = useState<Condition>("knee");
  const [goal, setGoal] = useState(GOALS[0]);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [hipaa, setHipaa] = useState(false);
  const [gdpr, setGdpr] = useState(false);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const otpChallenge = useOtp();

  async function onPatientSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hipaa || !gdpr) {
      setError("Please accept both privacy statements to continue.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!otpChallenge.awaiting) {
        const sent = await otpChallenge.request({ email, phone, purpose: "register" });
        if (!sent.ok) setError(sent.error ?? "Could not send the verification code.");
        return;
      }
      const verified = await otpChallenge.verify({ email, code: otp });
      if (!verified.ok) {
        setError(verified.error ?? "That code is not valid.");
        return;
      }
      const ok = await register({
        name,
        email,
        password,
        role: "patient",
        phone,
        condition,
        goal,
        dateOfBirth,
        address,
        emergencyName,
        emergencyPhone,
        medicalHistory,
      });
      if (!ok) {
        setError("That email is already in use.");
        return;
      }
      router.replace(homePath("patient"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="no-underline">
        <Logo className="text-xl" />
      </Link>
      <div className="card mt-6 space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Create your profile</h1>
        <p className="text-muted">
          Patients can start immediately. Doctors complete a verification form — documents go to review before the
          portal opens.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(["patient", "physio"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`btn ${role === r ? "btn-primary" : "btn-ghost"}`}
            >
              {r === "patient" ? "Patient portal" : "Doctor portal"}
            </button>
          ))}
        </div>

        {role === "physio" ? (
          <DoctorRegisterForm />
        ) : (
          <form onSubmit={onPatientSubmit} className="space-y-4">
            <label className="block space-y-1">
              <span>Full name</span>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1">
                <span>Email</span>
                <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
              <label className="block space-y-1">
                <span>Phone</span>
                <input className="field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </label>
            </div>
            <label className="block space-y-1">
              <span>Password</span>
              <input
                className="field"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <label className="block space-y-1">
              <span>Date of birth</span>
              <input className="field" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
            </label>
            <label className="block space-y-1">
              <span>Home address</span>
              <input className="field" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </label>
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
              <span>Goal</span>
              <select className="field" value={goal} onChange={(e) => setGoal(e.target.value)}>
                {GOALS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1">
                <span>Emergency contact name</span>
                <input className="field" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} required />
              </label>
              <label className="block space-y-1">
                <span>Emergency phone</span>
                <input className="field" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} required />
              </label>
            </div>
            <label className="block space-y-1">
              <span>Medical history / notes</span>
              <textarea className="field min-h-24" value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} />
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 h-5 w-5" checked={hipaa} onChange={(e) => setHipaa(e.target.checked)} />
              <span>I agree to the handling of health information for care (HIPAA-minded consent).</span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 h-5 w-5" checked={gdpr} onChange={(e) => setGdpr(e.target.checked)} />
              <span>I agree to GDPR-style processing and understand I can export or delete my data.</span>
            </label>
            {otpChallenge.awaiting && (
              <OtpChallenge
                code={otp}
                onCodeChange={setOtp}
                channel={otpChallenge.channel}
                devCode={otpChallenge.devCode}
                resendIn={otpChallenge.resendIn}
                expiresIn={otpChallenge.expiresIn}
                expired={otpChallenge.expired}
                onResend={() => void otpChallenge.resend()}
              />
            )}
            {error && <p className="text-rose">{error}</p>}
            <button className="btn btn-primary w-full" type="submit" disabled={busy}>
              {busy ? "Please wait…" : otpChallenge.awaiting ? "Verify and create profile" : "Send verification code"}
            </button>
          </form>
        )}
        <p className="text-center text-muted">
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
