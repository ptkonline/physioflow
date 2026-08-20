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

export function platformFeeInr() {
  const raw = Number(process.env.PAYMENT_PLATFORM_FEE_INR ?? process.env.NEXT_PUBLIC_PAYMENT_PLATFORM_FEE_INR ?? 49);
  return Number.isFinite(raw) ? Math.max(0, Math.round(raw)) : 49;
}

export function defaultConsultationFeeInr() {
  const raw = Number(process.env.PAYMENT_DEFAULT_FEE_INR ?? 800);
  return Number.isFinite(raw) ? Math.max(100, Math.round(raw)) : 800;
}

export function consultationFeeInr(doctorId: string, profileFee?: number) {
  if (SEED_CONSULTATION_FEES[doctorId] != null) return SEED_CONSULTATION_FEES[doctorId];
  if (typeof profileFee === "number" && profileFee >= 100 && profileFee <= 100000) {
    return Math.round(profileFee);
  }
  return defaultConsultationFeeInr();
}

export function quoteFees(doctorId: string, profileFee?: number): FeeQuote {
  const consultationFee = consultationFeeInr(doctorId, profileFee);
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
