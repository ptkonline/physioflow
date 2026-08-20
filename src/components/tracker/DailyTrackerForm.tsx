"use client";

import { todayKey } from "@/lib/dates";
import { useCurrentUser, useStore } from "@/lib/store";
import { useTranslations } from "next-intl";
import { FormEvent, useMemo, useState } from "react";

export function DailyTrackerForm() {
  const t = useTranslations("tracker");
  const { user, profile } = useCurrentUser();
  const { state, upsertDailyLog } = useStore();
  const today = todayKey();
  const existing = (state.dailyLogs ?? []).find((l) => l.patientId === user?.id && l.date === today);
  const [didExercises, setDidExercises] = useState(existing?.didExercises ?? true);
  const [painLevel, setPainLevel] = useState(existing?.painLevel ?? 3);
  const [note, setNote] = useState(existing?.note ?? "");
  const [saved, setSaved] = useState(false);

  const booking = useMemo(() => {
    if (!user) return undefined;
    return (state.bookings ?? [])
      .filter((b) => b.patientId === user.id && b.status !== "cancelled")
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))[0];
  }, [state.bookings, user]);

  if (!user) return null;
  const patientId = user.id;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    upsertDailyLog({
      patientId,
      appointmentId: booking?.id ?? "",
      doctorId: booking?.physioId || profile?.assignedPhysioId || "",
      date: today,
      didExercises,
      painLevel,
      note: note.trim(),
    });
    setSaved(true);
  }

  const history = (state.dailyLogs ?? [])
    .filter((l) => l.patientId === user.id)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-muted">{t("subtitle")}</p>
      </header>
      <form onSubmit={onSubmit} className="card space-y-4 p-5">
        {existing && <p className="text-sm text-muted">{t("already")}</p>}
        <fieldset className="space-y-2">
          <legend className="font-semibold">{t("didExercises")}</legend>
          <div className="flex gap-2">
            <button
              type="button"
              className={`btn ${didExercises ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setDidExercises(true)}
            >
              {t("yes")}
            </button>
            <button
              type="button"
              className={`btn ${!didExercises ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setDidExercises(false)}
            >
              {t("no")}
            </button>
          </div>
        </fieldset>
        <label className="block space-y-2">
          <span className="font-semibold">{t("pain")}</span>
          <input
            type="range"
            min={1}
            max={10}
            value={painLevel}
            onChange={(e) => setPainLevel(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-2xl font-semibold">{painLevel}/10</p>
        </label>
        <label className="block space-y-1">
          <span>{t("note")}</span>
          <textarea
            className="field min-h-20"
            placeholder={t("notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button className="btn btn-primary" type="submit">
          {existing ? t("update") : t("submit")}
        </button>
        {saved && <p className="text-teal-dark">{t("saved")}</p>}
      </form>
      <article className="card p-5">
        <h2 className="font-semibold">{t("history")}</h2>
        <ul className="mt-3 space-y-2">
          {history.map((row) => (
            <li key={row.id} className="flex flex-wrap justify-between gap-2 border-t border-line pt-2 text-sm">
              <span>{row.date}</span>
              <span>
                {row.didExercises ? t("yes") : t("no")} · {row.painLevel}/10
              </span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
