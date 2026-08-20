/**
 * Firebase Cloud Function — appointment reminders (24h and 1h).
 *
 * Deploy: cd functions && npm i && firebase deploy --only functions
 * Schedule: every 15 minutes via Cloud Scheduler (pubsub).
 *
 * Requires:
 *   - Firestore `bookings` with scheduledAt, status, patientId, physioId, patientPhone, reminded24h, reminded1h
 *   - users/{uid}.fcmToken for FCM
 *   - Secret TWILIO_* if SMS is enabled
 */
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { initializeApp } from "firebase-admin/app";

initializeApp();

const HOUR_MS = 60 * 60 * 1000;

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
    const window = until > 0 && until <= HOUR_MS ? "1h" : until > HOUR_MS && until <= 24 * HOUR_MS ? "24h" : null;
    if (!window) continue;
    const flag = window === "1h" ? "reminded1h" : "reminded24h";
    if (data[flag]) continue;

    const patient = await db.collection("users").doc(String(data.patientId)).get();
    const token = patient.get("fcmToken") as string | undefined;
    const title = window === "1h" ? "Appointment in 1 hour" : "Appointment in 24 hours";
    const body = String(data.reason ?? "Your physiotherapy visit");

    if (token) {
      await getMessaging().send({ token, notification: { title, body } });
    }

    // SMS: wire Twilio here using patientPhone when FCM token is missing.
    // await twilio.messages.create({ to: data.patientPhone, body: `${title}: ${body}` });

    await doc.ref.update({ [flag]: true });
    await db.collection("reminder_dispatches").add({
      appointmentId: doc.id,
      patientId: data.patientId,
      window,
      channel: token ? "push" : "sms",
      sentAt: Timestamp.now(),
    });
  }
});
