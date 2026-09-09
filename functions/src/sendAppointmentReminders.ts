/**
 * Firebase Cloud Function — appointment reminders (24h, 1h, and 30m).
 *
 * Deploy: cd functions && npm i && firebase deploy --only functions
 * Schedule: every 15 minutes via Cloud Scheduler (pubsub).
 *
 * Requires:
 *   - Firestore `bookings` with scheduledAt, status, patientId, physioId, patientPhone, reminded*
 *   - users/{uid}.fcmToken for FCM
 *   - Secret TWILIO_* if SMS is enabled
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { initializeApp } from "firebase-admin/app";

initializeApp();

const HOUR_MS = 60 * 60 * 1000;
const HALF_HOUR_MS = 30 * 60 * 1000;

export const sendAppointmentReminders = onSchedule("every 15 minutes", async () => {
  const db = getFirestore();
  const now = Date.now();
  const snap = await db.collection("bookings").where("status", "==", "upcoming").get();

  for (const doc of snap.docs) {
    const data = doc.data();
    const start =
      typeof data.scheduledAt === "string"
        ? new Date(data.scheduledAt).getTime()
        : (data.scheduledAt as Timestamp | undefined)?.toMillis?.() ?? 0;
    if (!start) continue;
    const until = start - now;
    const window =
      until > 0 && until <= HALF_HOUR_MS
        ? "30m"
        : until > HALF_HOUR_MS && until <= HOUR_MS
          ? "1h"
          : until > HOUR_MS && until <= 24 * HOUR_MS
            ? "24h"
            : null;
    if (!window) continue;
    const flag = window === "30m" ? "reminded30m" : window === "1h" ? "reminded1h" : "reminded24h";
    if (data[flag]) continue;

    const patient = await db.collection("users").doc(String(data.patientId)).get();
    const token = patient.get("fcmToken") as string | undefined;
    const patientEmail = String(data.patientEmail ?? patient.get("email") ?? "");
    const title =
      window === "30m"
        ? "Appointment in 30 minutes"
        : window === "1h"
          ? "Appointment in 1 hour"
          : "Appointment in 24 hours";
    const body = String(data.reason ?? "Your physiotherapy visit");
    const when =
      typeof data.scheduledAt === "string"
        ? new Date(data.scheduledAt).toLocaleString("en-IN")
        : new Date(start).toLocaleString("en-IN");

    if (token) {
      await getMessaging().send({ token, notification: { title, body } });
    }

    if (patientEmail) {
      // Mirror API cron: email via Resend when configured in Functions env (optional).
      const key = process.env.RESEND_API_KEY;
      if (key) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.NOTIFY_FROM_EMAIL || "PhysioFlow <noreply@resend.dev>",
            to: [patientEmail],
            subject: `PhysioFlow: ${title}`,
            text: `${body}\nWhen: ${when}`,
          }),
        }).catch(() => undefined);
      }
    }

    // SMS: wire Twilio here using patientPhone when FCM token is missing.
    // await twilio.messages.create({ to: data.patientPhone, body: `${title}: ${body}` });

    await doc.ref.update({ [flag]: true });
    await db.collection("reminder_dispatches").add({
      appointmentId: doc.id,
      patientId: data.patientId,
      window,
      channel: token ? "push" : patientEmail ? "email" : "sms",
      sentAt: Timestamp.now(),
    });
  }
});
