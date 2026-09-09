import { quoteFees, type AppointmentDraft } from "@/lib/pricing";
import { sendPlainEmail } from "@/lib/server/mail";
import { getAdminDb } from "@/lib/server/firebase-admin";

async function sendFcmToUser(userId: string, title: string, body: string) {
  if (!userId) return;
  const db = await getAdminDb();
  if (!db) return;
  try {
    const snap = await db.collection("users").doc(userId).get();
    const token = String(snap.data()?.fcmToken ?? "").trim();
    if (!token) return;
    const admin = await import("firebase-admin");
    await admin.messaging().send({ token, notification: { title, body } });
  } catch (err) {
    console.warn("[payment-notify/fcm]", err instanceof Error ? err.message : err);
  }
}

export async function notifyDoctorOfPayment(input: {
  doctorEmail: string;
  doctorName: string;
  patientName: string;
  scheduledAt: string;
  amount: number;
  paymentId: string;
  doctorId?: string;
}) {
  const when = new Date(input.scheduledAt).toLocaleString("en-IN");
  const text = [
    `A patient paid and confirmed a visit with ${input.doctorName}.`,
    "",
    `Patient: ${input.patientName}`,
    `When: ${when}`,
    `Amount: ₹${input.amount}`,
    `Payment ID: ${input.paymentId}`,
  ].join("\n");

  if (!input.doctorEmail) {
    console.info("[payment-notify/doctor]", text);
    return { sent: false };
  }
  const email = await sendPlainEmail({
    to: input.doctorEmail,
    subject: `Paid booking: ${input.patientName}`,
    text,
  });
  if (input.doctorId) {
    await sendFcmToUser(
      input.doctorId,
      "New paid booking",
      `${input.patientName} · ${when}`,
    );
  }
  return email;
}

export async function notifyPatientOfPayment(input: {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  scheduledAt: string;
  bookingId: string;
  paymentId: string;
  patientId?: string;
}) {
  const when = new Date(input.scheduledAt).toLocaleString("en-IN");
  const text = [
    `Appointment confirmed with Dr. ${input.doctorName} at ${when}.`,
    `Booking ID: ${input.bookingId}`,
    `Payment ID: ${input.paymentId}`,
    "",
    `Hi ${input.patientName || "there"},`,
    "Your payment was received. See you at the visit.",
  ].join("\n");

  if (!input.patientEmail) {
    console.info("[payment-notify/patient]", text);
    return { sent: false };
  }
  const email = await sendPlainEmail({
    to: input.patientEmail,
    subject: `Appointment confirmed with Dr. ${input.doctorName}`,
    text,
  });
  if (input.patientId) {
    await sendFcmToUser(
      input.patientId,
      "Appointment confirmed",
      `Dr. ${input.doctorName} at ${when}. Booking ID: ${input.bookingId}`,
    );
  }
  return email;
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
    mode: body.mode === "offline" ? "offline" : "online",
    onlineFee: Number(body.onlineFee) || undefined,
    offlineFee: Number(body.offlineFee) || undefined,
  };
}
