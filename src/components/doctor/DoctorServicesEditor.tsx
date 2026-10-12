"use client";

import { StepScreen } from "@/components/flow/StepScreen";
import type { PhysioService, ServiceMode } from "@/lib/care-types";
import { persistDoctorPublic } from "@/lib/doctor-public";
import { formatInr } from "@/lib/pricing";
import { activeServices, newServiceId, normalizeServices } from "@/lib/services";
import { useCurrentUser, useStore } from "@/lib/store";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";

const MODES: ServiceMode[] = ["online", "offline", "both"];

export function DoctorServicesEditor() {
  const t = useTranslations("services");
  const tc = useTranslations("common");
  const { user } = useCurrentUser();
  const { state, updateDoctor } = useStore();
  const doctor = state.doctors.find((item) => item.userId === user?.id);
  const [editing, setEditing] = useState<PhysioService | null>(null);
  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  if (!user || !doctor) return <p className="text-muted">{t("noProfile")}</p>;
  const profile = doctor;
  const account = user;
  const services = normalizeServices(profile.services);

  async function persist(nextServices: PhysioService[], message: string) {
    const next = { ...profile, services: nextServices };
    updateDoctor(next);
    setError("");
    try {
      await persistDoctorPublic(next, account.email);
      setSaved(message);
    } catch (err) {
      setSaved(message);
      setError(err instanceof Error ? err.message : t("syncLater"));
    }
  }

  function startNew() {
    setEditing({
      id: newServiceId(),
      name: "",
      description: "",
      price: 800,
      durationMin: 30,
      mode: "both",
      active: true,
    });
    setStep(1);
    setSaved("");
    setError("");
  }

  function startEdit(service: PhysioService) {
    setEditing({ ...service });
    setStep(1);
    setSaved("");
  }

  async function remove(id: string) {
    await persist(
      services.filter((service) => service.id !== id),
      t("removed"),
    );
  }

  async function finish(event?: FormEvent) {
    event?.preventDefault();
    if (!editing) return;
    const name = editing.name.trim();
    if (name.length < 2) {
      setError(t("nameRequired"));
      setStep(1);
      return;
    }
    if (!(editing.price >= 100 && editing.price <= 100000)) {
      setError(t("priceRequired"));
      setStep(2);
      return;
    }
    const nextService = { ...editing, name, price: Math.round(editing.price), active: true };
    const exists = services.some((service) => service.id === nextService.id);
    const next = exists ? services.map((service) => (service.id === nextService.id ? nextService : service)) : [...services, nextService];
    await persist(next, t("saved"));
    setEditing(null);
  }

  if (!editing) {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-3xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-muted">{t("subtitle")}</p>
        </header>
        {saved && <p className="text-teal-dark">{saved}</p>}
        {error && <p className="text-rose">{error}</p>}
        {activeServices(services).length === 0 ? (
          <div className="card space-y-3 p-5">
            <p className="text-lg font-semibold">{t("emptyTitle")}</p>
            <p className="text-muted">{t("emptyHint")}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {services.map((service) => (
              <li key={service.id} className="service-card">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{service.name}</span>
                  <span className="mt-0.5 block text-sm text-muted">
                    {service.durationMin} {t("min")} · {t(service.mode)}
                  </span>
                </span>
                <span className="price-tag">{formatInr(service.price)}</span>
                <span className="flex flex-col gap-2">
                  <button type="button" className="btn btn-ghost px-3" onClick={() => startEdit(service)}>
                    {t("edit")}
                  </button>
                  <button type="button" className="btn btn-ghost px-3" onClick={() => void remove(service.id)}>
                    {t("remove")}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="btn btn-primary w-full" onClick={startNew}>
          {t("add")}
        </button>
      </div>
    );
  }

  const draft = editing;
  return (
    <form className="card space-y-4 p-4 sm:p-5" onSubmit={(event) => void finish(event)}>
      {step === 1 && (
        <StepScreen
          step={1}
          total={3}
          title={t("nameStep")}
          hint={t("nameHint")}
          backLabel={tc("cancel")}
          onBack={() => setEditing(null)}
          primaryLabel={tc("continue")}
          primaryDisabled={draft.name.trim().length < 2}
          onPrimary={() => setStep(2)}
        >
          <label className="block space-y-1">
            <span>{t("name")}</span>
            <input className="field" value={draft.name} onChange={(e) => setEditing({ ...draft, name: e.target.value })} placeholder={t("namePlaceholder")} required />
          </label>
          <label className="block space-y-1">
            <span>{t("description")}</span>
            <input className="field" value={draft.description} onChange={(e) => setEditing({ ...draft, description: e.target.value })} placeholder={t("descriptionPlaceholder")} />
          </label>
        </StepScreen>
      )}
      {step === 2 && (
        <StepScreen
          step={2}
          total={3}
          title={t("priceStep")}
          hint={t("priceHint")}
          backLabel={t("back")}
          onBack={() => setStep(1)}
          primaryLabel={tc("continue")}
          primaryDisabled={!(draft.price >= 100)}
          onPrimary={() => setStep(3)}
        >
          <label className="block space-y-1">
            <span>{t("price")}</span>
            <input
              className="field text-2xl font-semibold"
              type="number"
              min={100}
              max={100000}
              step={50}
              value={draft.price}
              onChange={(e) => setEditing({ ...draft, price: Number(e.target.value) })}
              required
            />
          </label>
          <p className="text-3xl font-semibold">{formatInr(Number.isFinite(draft.price) ? draft.price : 0)}</p>
        </StepScreen>
      )}
      {step === 3 && (
        <StepScreen
          step={3}
          total={3}
          title={t("whereStep")}
          hint={t("whereHint")}
          backLabel={t("back")}
          onBack={() => setStep(2)}
          primaryLabel={t("saveService")}
          onPrimary={() => void finish()}
        >
          <div className="grid gap-2">
            {MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                className={`btn ${draft.mode === mode ? "btn-primary" : "btn-ghost"} justify-start`}
                onClick={() => setEditing({ ...draft, mode })}
              >
                {t(mode)}
              </button>
            ))}
          </div>
          <label className="block space-y-1">
            <span>{t("duration")}</span>
            <select className="field" value={draft.durationMin} onChange={(e) => setEditing({ ...draft, durationMin: Number(e.target.value) })}>
              {[30, 45, 60].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} {t("min")}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="text-rose">{error}</p>}
        </StepScreen>
      )}
    </form>
  );
}
