"use client";

import type { DoctorLocation } from "@/lib/care-types";
import { useTranslations } from "next-intl";

export function MapDirectionButton({ location, clinicName }: { location?: DoctorLocation; clinicName: string }) {
  const t = useTranslations("map");
  if (!location) {
    return <p className="text-muted">{t("missing")}</p>;
  }
  const { lat, lng, address } = location;
  const query = encodeURIComponent(`${lat},${lng}`);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <article className="card space-y-3 overflow-hidden p-0">
      <iframe title={clinicName} src={embed} className="h-48 w-full border-0" loading="lazy" />
      <div className="space-y-2 p-4 pt-0">
        <h2 className="font-semibold">{t("clinic")}</h2>
        <p className="text-muted">{address}</p>
        <a className="btn btn-primary" href={mapsUrl} target="_blank" rel="noreferrer">
          {t("directions")}
        </a>
      </div>
    </article>
  );
}
