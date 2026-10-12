"use client";

import { DoctorRegisterForm } from "@/components/DoctorRegisterForm";
import { Logo } from "@/components/Logo";
import { StepScreen } from "@/components/flow/StepScreen";
import { isFirebaseConfigured } from "@/lib/firebase-config";
import { homePath } from "@/lib/paths";
import { CONDITIONS, GOALS } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { Condition, Role } from "@/lib/types";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const { register } = useStore();
  const router = useRouter();
  const [role, setRole] = useState<Role>("patient");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [condition, setCondition] = useState<Condition>("knee");
  const [goal, setGoal] = useState(GOALS[0]);
  const [hipaa, setHipaa] = useState(false);
  const [gdpr, setGdpr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function createPatient() {
    if (!hipaa || !gdpr) {
      setError(t("consentRequired"));
      return;
    }
    if (!isFirebaseConfigured()) {
      setError(t("firebaseRequired"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const ok = await register({
        name,
        email,
        password,
        role: "patient",
        phone,
        condition,
        goal,
      });
      if (!ok) {
        setError(t("emailTaken"));
        return;
      }
      router.replace(homePath("patient"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("createFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Link href="/" className="no-underline">
        <Logo className="text-xl" />
      </Link>
      <div className="card mt-5 space-y-4 p-5">
        <h1 className="text-2xl font-semibold">{t("createTitle")}</h1>
        <p className="text-muted">{t("passwordOnly")}</p>
        <div className="grid grid-cols-2 gap-2">
          {(["patient", "physio"] as Role[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setRole(value);
                setStep(1);
                setError("");
              }}
              className={`btn ${role === value ? "btn-primary" : "btn-ghost"}`}
            >
              {value === "patient" ? t("patientRole") : t("doctorRole")}
            </button>
          ))}
        </div>

        {role === "physio" ? (
          <DoctorRegisterForm />
        ) : (
          <>
            {step === 1 && (
              <StepScreen
                step={1}
                total={2}
                title={t("accountStep")}
                hint={t("accountHint")}
                primaryLabel={tc("continue")}
                primaryDisabled={!name.trim() || !email.includes("@") || password.length < 6}
                onPrimary={() => {
                  setError("");
                  setStep(2);
                }}
              >
                <label className="block space-y-1">
                  <span>{t("fullName")}</span>
                  <input className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label className="block space-y-1">
                  <span>{t("email")}</span>
                  <input className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label className="block space-y-1">
                  <span>{t("password")}</span>
                  <input className="field" type="password" autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
                </label>
              </StepScreen>
            )}
            {step === 2 && (
              <StepScreen
                step={2}
                total={2}
                title={t("aboutStep")}
                hint={t("aboutHint")}
                backLabel={t("back")}
                onBack={() => setStep(1)}
                primaryLabel={t("createAccount")}
                busy={busy}
                primaryDisabled={!phone.trim()}
                onPrimary={() => void createPatient()}
              >
                <label className="block space-y-1">
                  <span>{t("phone")}</span>
                  <input className="field" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </label>
                <label className="block space-y-1">
                  <span>{t("condition")}</span>
                  <select className="field" value={condition} onChange={(e) => setCondition(e.target.value as Condition)}>
                    {CONDITIONS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span>{t("goal")}</span>
                  <select className="field" value={goal} onChange={(e) => setGoal(e.target.value)}>
                    {GOALS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 h-5 w-5" checked={hipaa} onChange={(e) => setHipaa(e.target.checked)} />
                  <span>{t("hipaa")}</span>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" className="mt-1 h-5 w-5" checked={gdpr} onChange={(e) => setGdpr(e.target.checked)} />
                  <span>{t("gdpr")}</span>
                </label>
              </StepScreen>
            )}
            {error && <p className="text-rose">{error}</p>}
          </>
        )}
        <p className="text-center text-muted">
          {t("haveAccount")} <Link href="/login">{tc("signIn")}</Link>
        </p>
      </div>
    </div>
  );
}
