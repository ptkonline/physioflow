"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ verified }: { verified?: boolean }) {
  const t = useTranslations("common");
  if (!verified) return null;
  return (
    <span className="chip inline-flex items-center gap-1 bg-sage text-teal-dark">
      <BadgeCheck size={14} /> {t("verified")} ✓
    </span>
  );
}
