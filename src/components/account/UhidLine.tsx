"use client";

import { useTranslations } from "next-intl";

export function UhidLine({ uhid }: { uhid?: string }) {
  const t = useTranslations("account");
  return (
    <p className="text-sm">
      <span className="font-semibold">{t("uhid")}</span>{" "}
      <span className="font-mono">{uhid || "—"}</span>
      <span className="mt-1 block text-muted">{t("uhidHint")}</span>
    </p>
  );
}
