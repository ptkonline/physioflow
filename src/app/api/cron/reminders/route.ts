import { getAdminDb } from "@/lib/server/firebase-admin";
import { sendPlainEmail } from "@/lib/server/mail";
import { NextResponse } from "next/server";

const HOUR = 60 * 60 * 1000;
const HALF_HOUR = 30 * 60 * 1000;

type ReminderWindow = "30m" | "1h" | "24h";

function pickWindow(until: number): ReminderWindow | null {
  if (until > 0 && until <= HALF_HOUR) return "30m";
  if (until > HALF_HOUR && until <= HOUR) return "1h";
  if (until > HOUR && until <= 24 * HOUR) return "24h";
  return null;
}

function flagFor(window: ReminderWindow) {
  if (window === "30m") return "reminded30m";
  if (window === "1h") return "reminded1h";
  return "reminded24h";
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getAdminDb();
  if (!db) {
    return NextResponse.json({
      ok: true,
      sent: 0,
      stub: false,
      hint: "Add FIREBASE_SERVICE_ACCOUNT_JSON (and usually RESEND_API_KEY) so this hourly cron can load bookings and send email/FCM. Client ReminderWatcher still covers in-browser sessions.",
    });
  }

  const snap = await db.collection("bookings").where("status", "==", "upcoming").get();
  let sent = 0;
  const now = Date.now();

  for (const doc of snap.docs) {
    const data = doc.data();
    const start = Date.parse(String(data.scheduledAt ?? ""));
    if (!Number.isFinite(start)) continue;
    const until = start - now;
    const window = pickWindow(until);
    if (!window) continue;
    const flag = flagFor(window);
    if (data[flag]) continue;

    const title =
      window === "30m"
        ? "Appointment in 30 minutes"
        : window === "1h"
          ? "Appointment in 1 hour"
          : "Appointment in 24 hours";
    const body = String(data.reason ?? "Your physiotherapy visit");
    const patientEmail = String(data.patientEmail ?? "");
    const doctorEmail = String(data.doctorEmail ?? "");
    const patientId = String(data.patientId ?? "");
    const when = new Date(start).toLocaleString("en-IN");

    if (patientEmail) {
      await sendPlainEmail({
        to: patientEmail,
        subject: `PhysioFlow: ${title}`,
        text: `${body}\nWhen: ${when}`,
      });
    }
    if (doctorEmail) {
      await sendPlainEmail({
        to: doctorEmail,
        subject: `PhysioFlow: Visit ${window === "30m" ? "in 30 minutes" : window === "1h" ? "in 1 hour" : "tomorrow"}`,
        text: `${String(data.patientName ?? "Patient")} · ${body}\nWhen: ${when}`,
      });
    }

    try {
      const admin = await import("firebase-admin");
      const patient = await db.collection("users").doc(patientId).get();
      const token = patient.data()?.fcmToken as string | undefined;
      if (token) {
        await admin.messaging().send({ token, notification: { title, body } });
      }
    } catch {
      /* FCM optional */
    }

    await doc.ref.update({ [flag]: true });
    await db.collection("reminder_dispatches").add({
      appointmentId: doc.id,
      patientId,
      window,
      channel: "email",
      sentAt: new Date().toISOString(),
    });
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}
