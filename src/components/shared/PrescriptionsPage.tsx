"use client";

import { PrescriptionGenerator, PrescriptionList } from "@/components/prescriptions/PrescriptionGenerator";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

export function PrescriptionsPage({ portal }: { portal: "patient" | "doctor" }) {
  const t = useTranslations("rx");
  const tc = useTranslations("common");

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-muted">{portal === "doctor" ? t("doctorHelp") : t("patientHelp")}</p>
      </header>
      {portal === "doctor" && (
        <Suspense fallback={<p>{tc("loading")}</p>}>
          <PrescriptionGenerator />
        </Suspense>
      )}
      <PrescriptionList portal={portal} />
    </div>
  );
}
