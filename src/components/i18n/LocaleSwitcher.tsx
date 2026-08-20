"use client";

import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, type AppLocale } from "@/lib/firestore-schema";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  function setLocale(next: AppLocale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className={`btn ${locale === code ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setLocale(code)}
        >
          {code === "hi" ? t("hindi") : t("english")}
        </button>
      ))}
    </div>
  );
}

export function currentLocaleFromCookie(): AppLocale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${LOCALE_COOKIE}=`));
  const value = match?.split("=")[1];
  return LOCALES.includes(value as AppLocale) ? (value as AppLocale) : DEFAULT_LOCALE;
}
