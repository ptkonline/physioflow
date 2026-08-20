"use client";

import { useStore } from "@/lib/store";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";

export function RatingAndReview({
  appointmentId,
  patientId,
  doctorId,
  doctorName,
}: {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
}) {
  const t = useTranslations("review");
  const { state, addReview } = useStore();
  const existing = state.reviews.find((r) => r.appointmentId === appointmentId);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);

  if (existing) {
    return <p className="text-sm text-muted">{t("existing", { rating: existing.rating })}{existing.comment ? ` — ${existing.comment}` : ""}.</p>;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    addReview({ appointmentId, patientId, doctorId, rating, comment });
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-2 rounded-xl bg-white p-3 ring-1 ring-line">
      <p className="font-medium">{t("rate", { name: doctorName })}</p>
      <div className="flex gap-1" role="group" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`text-2xl ${n <= rating ? "text-amber" : "text-line"}`}
            onClick={() => setRating(n)}
            aria-label={`${n}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="field min-h-16"
        placeholder={t("placeholder")}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button className="btn btn-primary" type="submit">
        {t("submit")}
      </button>
      {saved && <p className="text-sm text-teal-dark">{t("thanks")}</p>}
    </form>
  );
}
