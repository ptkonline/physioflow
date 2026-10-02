import type { PhysioService, ServiceMode, VisitMode } from "./care-types";
import { doctorPricing } from "./pricing";
import type { DoctorProfile } from "./types";

export function newServiceId() {
  return `svc-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeServices(value: unknown): PhysioService[] {
  if (!Array.isArray(value)) return [];
  const out: PhysioService[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name = String(row.name ?? "").trim();
    const price = Number(row.price);
    if (!name || !Number.isFinite(price) || price < 100 || price > 100000) continue;
    const mode: ServiceMode = row.mode === "online" || row.mode === "offline" || row.mode === "both" ? row.mode : "both";
    const duration = Number(row.durationMin);
    out.push({
      id: String(row.id || newServiceId()),
      name: name.slice(0, 80),
      description: String(row.description ?? "").slice(0, 180),
      price: Math.round(price),
      durationMin: Number.isFinite(duration) && duration >= 15 && duration <= 180 ? Math.round(duration) : 30,
      mode,
      active: row.active !== false,
    });
  }
  return out.slice(0, 40);
}

export function activeServices(services?: PhysioService[]) {
  return (services ?? []).filter((service) => service.active);
}

export function lowestServicePrice(services?: PhysioService[]) {
  const listed = activeServices(services);
  if (!listed.length) return null;
  return Math.min(...listed.map((service) => service.price));
}

export function serviceVisitMode(service: PhysioService, preferred: VisitMode = "online"): VisitMode {
  if (service.mode === "both") return preferred;
  return service.mode;
}

/** Listed treatments, or the doctor's online/clinic fees when they have not added any yet. */
export function bookableServices(
  doctor: Pick<DoctorProfile, "userId" | "consultationFee" | "pricing" | "services" | "availability">,
): PhysioService[] {
  const listed = activeServices(normalizeServices(doctor.services));
  if (listed.length) return listed;
  const pricing = doctorPricing(doctor.userId, {
    consultationFee: doctor.consultationFee,
    pricing: doctor.pricing,
  });
  const durationMin = doctor.availability?.slotMin ?? 30;
  return [
    {
      id: "visit-online",
      name: "",
      description: "",
      price: pricing.onlineFee,
      durationMin,
      mode: "online",
      active: true,
    },
    {
      id: "visit-clinic",
      name: "",
      description: "",
      price: pricing.offlineFee,
      durationMin,
      mode: "offline",
      active: true,
    },
  ];
}
