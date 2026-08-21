import type { ClinicLocation, DoctorLocation } from "./care-types";
import type { DoctorProfile } from "./types";

const EARTH_KM = 6371;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in kilometres (Haversine). */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function formatDistanceKm(km: number) {
  if (!Number.isFinite(km)) return "";
  if (km < 1) return `${Math.max(50, Math.round(km * 1000))} m away`;
  return `${km.toFixed(1)} km away`;
}

export function clinicPoint(doctor?: DoctorProfile | null): ClinicLocation | null {
  if (!doctor) return null;
  if (
    doctor.clinicLocation &&
    Number.isFinite(doctor.clinicLocation.latitude) &&
    Number.isFinite(doctor.clinicLocation.longitude)
  ) {
    return doctor.clinicLocation;
  }
  const loc = doctor.location;
  if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
    return { latitude: loc.lat, longitude: loc.lng, address: loc.address };
  }
  return null;
}

export function toDoctorLocation(clinic: ClinicLocation, city?: string): DoctorLocation {
  return {
    address: clinic.address,
    city,
    lat: clinic.latitude,
    lng: clinic.longitude,
  };
}

export type GeoPermission = "prompt" | "granted" | "denied" | "unsupported";

export function readPatientCoords(): { latitude: number; longitude: number } | null {
  try {
    const raw = sessionStorage.getItem("pf.patient.geo");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { latitude?: number; longitude?: number };
    if (!Number.isFinite(parsed.latitude) || !Number.isFinite(parsed.longitude)) return null;
    return { latitude: parsed.latitude as number, longitude: parsed.longitude as number };
  } catch {
    return null;
  }
}

export function savePatientCoords(coords: { latitude: number; longitude: number }) {
  sessionStorage.setItem("pf.patient.geo", JSON.stringify(coords));
}
