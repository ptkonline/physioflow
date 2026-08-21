"use client";

import type { ClinicLocation } from "@/lib/care-types";

export function ClinicMapThumb({ location, name }: { location: ClinicLocation; name: string }) {
  const { latitude: lat, longitude: lng } = location;
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <iframe title={`${name} clinic map`} src={embed} className="mt-3 h-28 w-full rounded-xl border-0 ring-1 ring-line" loading="lazy" />
  );
}
