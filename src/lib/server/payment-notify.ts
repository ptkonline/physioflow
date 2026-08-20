import { quoteFees, type AppointmentDraft } from "@/lib/pricing";

export async function notifyDoctorOfPayment(input: {
  doctorEmail: string;
  doctorName: string;
  patientName: string;
  scheduledAt: string;
  amount: number;
  paymentId: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM_EMAIL || "PhysioFlow <noreply@resend.dev>";
  const when = new Date(input.scheduledAt).toLocaleString("en-IN");
  const text = [
    `A patient paid and confirmed a visit with ${input.doctorName}.`,
    "",
    `Patient: ${input.patientName}`,
    `When: ${when}`,
    `Amount: ₹${input.amount}`,
    `Payment ID: ${input.paymentId}`,
  ].join("\n");

  if (!resendKey || !input.doctorEmail) {
    console.info("[payment-notify]", text);
    return { sent: false };
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.doctorEmail],
      subject: `Paid booking: ${input.patientName}`,
      text,
    }),
  });
  return { sent: true };
}

export function serverQuote(doctorId: string, profileFee?: number) {
  return quoteFees(doctorId, profileFee);
}

export function parseDraft(body: Record<string, unknown>): AppointmentDraft | null {
  const doctorId = String(body.doctorId ?? "");
  const patientId = String(body.patientId ?? "");
  const scheduledAt = String(body.scheduledAt ?? "");
  if (!doctorId || !patientId || !scheduledAt) return null;
  if (Number.isNaN(Date.parse(scheduledAt))) return null;
  return {
    createdById: String(body.createdById ?? patientId),
    doctorId,
    doctorName: String(body.doctorName ?? "Doctor"),
    doctorEmail: String(body.doctorEmail ?? ""),
    patientId,
    patientName: String(body.patientName ?? ""),
    patientEmail: String(body.patientEmail ?? ""),
    patientPhone: String(body.patientPhone ?? ""),
    scheduledAt,
    durationMin: Math.max(15, Number(body.durationMin ?? 30) || 30),
    reason: String(body.reason ?? "Consultation").slice(0, 200),
    notes: String(body.notes ?? "").slice(0, 1000),
  };
}
