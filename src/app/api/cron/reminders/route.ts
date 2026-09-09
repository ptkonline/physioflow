import { getAdminDb } from "@/lib/server/firebase-admin";
import { sendPlainEmail } from "@/lib/server/mail";
import { NextResponse } from "next/server";

const HOUR = 60 * 60 * 1000;

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
      hint: "Client ReminderWatcher still runs locally. Add FIREBASE_SERVICE_ACCOUNT_JSON to send FCM/email from this cron.",
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
    const window = until > 0 && until <= HOUR ? "1h" : until > HOUR && until <= 24 * HOUR ? "24h" : null;
    if (!window) continue;
    const flag = window === "1h" ? "reminded1h" : "reminded24h";
    if (data[flag]) continue;

    const title = window === "1h" ? "Appointment in 1 hour" : "Appointment in 24 hours";
    const body = String(data.reason ?? "Your physiotherapy visit");
    const patientEmail = String(data.patientEmail ?? "");
    const doctorEmail = String(data.doctorEmail ?? "");
    const patientId = String(data.patientId ?? "");

    if (patientEmail) {
      await sendPlainEmail({
        to: patientEmail,
        subject: `PhysioFlow: ${title}`,
        text: `${body}\nWhen: ${new Date(start).toLocaleString("en-IN")}`,
      });
    }
    if (doctorEmail) {
      await sendPlainEmail({
        to: doctorEmail,
        subject: `PhysioFlow: Visit ${window === "1h" ? "in 1 hour" : "tomorrow"}`,
        text: `${String(data.patientName ?? "Patient")} · ${body}\nWhen: ${new Date(start).toLocaleString("en-IN")}`,
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
