import type { DoctorPricing, VisitMode } from "./care-types";

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export interface FeeQuote {
  consultationFee: number;
  platformFee: number;
  amount: number;
  amountPaise: number;
  currency: "INR";
}

export interface AppointmentDraft {
  createdById: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  scheduledAt: string;
  durationMin: number;
  reason: string;
  notes: string;
  mode?: VisitMode;
  onlineFee?: number;
  offlineFee?: number;
}

export interface PaymentOrderRecord {
  orderId: string;
  receipt: string;
  quote: FeeQuote;
  draft: AppointmentDraft;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  paymentMethod?: string;
  paidAt?: string;
}

/** Seed consultation fees in INR — server never trusts a client-sent total. */
export const SEED_CONSULTATION_FEES: Record<string, number> = {
  "physio-james": 1500,
  "physio-aisha": 1800,
};

export const SEED_PRICING: Record<string, DoctorPricing> = {
  "physio-james": { onlineFee: 1500, offlineFee: 1800, currency: "INR" },
  "physio-aisha": { onlineFee: 1800, offlineFee: 2200, currency: "INR" },
};

function validFee(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 100 && value <= 100000;
}

export function doctorPricing(
  doctorId: string,
  input?: { consultationFee?: number; pricing?: DoctorPricing; onlineFee?: number; offlineFee?: number },
): DoctorPricing {
  if (SEED_PRICING[doctorId]) return SEED_PRICING[doctorId];
  const online =
    (validFee(input?.pricing?.onlineFee) ? input!.pricing!.onlineFee : undefined) ??
    (validFee(input?.onlineFee) ? input!.onlineFee : undefined) ??
    (validFee(input?.consultationFee) ? input!.consultationFee : undefined) ??
    defaultConsultationFeeInr();
  const offline =
    (validFee(input?.pricing?.offlineFee) ? input!.pricing!.offlineFee : undefined) ??
    (validFee(input?.offlineFee) ? input!.offlineFee : undefined) ??
    Math.round(online * 1.2);
  return {
    onlineFee: Math.round(online),
    offlineFee: Math.round(offline),
    currency: input?.pricing?.currency || "INR",
  };
}

export function modeFee(pricing: DoctorPricing, mode: VisitMode = "online") {
  return mode === "offline" ? pricing.offlineFee : pricing.onlineFee;
}

export function platformFeeInr() {
  const raw = Number(process.env.PAYMENT_PLATFORM_FEE_INR ?? process.env.NEXT_PUBLIC_PAYMENT_PLATFORM_FEE_INR ?? 49);
  return Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 49;
}

export function defaultConsultationFeeInr() {
  const raw = Number(process.env.PAYMENT_DEFAULT_FEE_INR ?? 800);
  return Number.isFinite(raw) ? Math.max(100, Math.round(raw)) : 800;
}

export function consultationFeeInr(
  doctorId: string,
  profileFee?: number,
  mode: VisitMode = "online",
  extra?: { onlineFee?: number; offlineFee?: number; pricing?: DoctorPricing },
) {
  const pricing = doctorPricing(doctorId, { consultationFee: profileFee, ...extra });
  return modeFee(pricing, mode);
}

export function quoteFees(
  doctorId: string,
  profileFee?: number,
  mode: VisitMode = "online",
  extra?: { onlineFee?: number; offlineFee?: number; pricing?: DoctorPricing },
): FeeQuote {
  const consultationFee = consultationFeeInr(doctorId, profileFee, mode, extra);
  const platformFee = platformFeeInr();
  const amount = consultationFee + platformFee;
  return {
    consultationFee,
    platformFee,
    amount,
    amountPaise: amount * 100,
    currency: "INR",
  };
}

export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}
