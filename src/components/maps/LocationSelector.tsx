"use client";

import type { ClinicLocation } from "@/lib/care-types";
import { useState } from "react";

async function reverseGeocode(latitude: number, longitude: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return "";
  const body = (await res.json()) as { display_name?: string };
  return body.display_name ?? "";
}

export function LocationSelector({
  value,
  onChange,
}: {
  value?: ClinicLocation | null;
  onChange: (next: ClinicLocation) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lat = value?.latitude ?? 28.6139;
  const lng = value?.longitude ?? 77.209;
  const address = value?.address ?? "";
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`;

  function emit(next: Partial<ClinicLocation>) {
    onChange({
      latitude: next.latitude ?? lat,
      longitude: next.longitude ?? lng,
      address: next.address ?? address,
    });
  }

  async function useMyLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError("This browser does not support location. Enter the pin manually.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        let nextAddress = address;
        try {
          nextAddress = (await reverseGeocode(latitude, longitude)) || address;
        } catch {
          /* keep typed address */
        }
        onChange({ latitude, longitude, address: nextAddress });
        setBusy(false);
      },
      (err) => {
        setBusy(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location permission was denied. Allow it in the browser address bar, or type the address and coordinates.");
          return;
        }
        setError("Could not read GPS. Check that location is enabled, then try again.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30_000 },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">Clinic location</p>
        <button type="button" className="btn btn-ghost" onClick={() => void useMyLocation()} disabled={busy}>
          {busy ? "Detecting…" : "Use current GPS"}
        </button>
      </div>
      <iframe title="Clinic map preview" src={embed} className="h-48 w-full rounded-2xl border-0 ring-1 ring-line" loading="lazy" />
      <label className="block space-y-1">
        <span>Address</span>
        <textarea
          className="field min-h-20"
          value={address}
          onChange={(e) => emit({ address: e.target.value })}
          required
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span>Latitude</span>
          <input
            className="field"
            type="number"
            step="0.0001"
            value={Number.isFinite(lat) ? lat : ""}
            onChange={(e) => emit({ latitude: Number(e.target.value) })}
            required
          />
        </label>
        <label className="block space-y-1">
          <span>Longitude</span>
          <input
            className="field"
            type="number"
            step="0.0001"
            value={Number.isFinite(lng) ? lng : ""}
            onChange={(e) => emit({ longitude: Number(e.target.value) })}
            required
          />
        </label>
      </div>
      {error && <p className="text-rose">{error}</p>}
      <p className="text-sm text-muted">
        Chrome/Edge: the lock icon → Site settings → Location. Safari: Settings → Websites → Location. HTTPS (or
        localhost) is required.
      </p>
    </div>
  );
}
