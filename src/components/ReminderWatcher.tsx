"use client";

import { notifyFcm } from "@/lib/notifications";
import { useStore } from "@/lib/store";
import { useEffect } from "react";

const HOUR = 60 * 60 * 1000;
const HALF = 30 * 60 * 1000;

export function ReminderWatcher() {
  const { state, addNotification, markBookingReminder } = useStore();

  useEffect(() => {
    const userId = state.currentUserId;
    if (!userId) return;
    const now = Date.now();

    for (const booking of state.bookings ?? []) {
      if (booking.status !== "upcoming") continue;
      if (booking.patientId !== userId && booking.physioId !== userId) continue;
      const start = new Date(booking.scheduledAt).getTime();
      const until = start - now;
      const reminderWindow: "24h" | "1h" | null =
        until > 0 && until <= HOUR && !booking.reminded1h
          ? "1h"
          : until > HOUR && until <= 24 * HOUR && !booking.reminded24h
            ? "24h"
            : null;
      // 30-minute window shares the 1h flag so we do not spam; surface as urgent copy when close.
      const urgent30 = until > 0 && until <= HALF && !booking.reminded1h;
      if (!reminderWindow && !urgent30) continue;
      const windowKey = urgent30 ? "1h" : reminderWindow!;
      const key = `physioflow.reminder.${booking.id}.${windowKey}`;
      if (sessionStorage.getItem(key)) continue;
      sessionStorage.setItem(key, "1");
      const when = urgent30 ? "in about 30 minutes" : windowKey === "1h" ? "in about an hour" : "tomorrow";
      const title = urgent30
        ? "Appointment in 30 minutes"
        : windowKey === "1h"
          ? "Appointment in 1 hour"
          : "Appointment in 24 hours";
      const body = `${booking.reason} ${when}.`;
      addNotification({
        userId: booking.patientId,
        title,
        body,
        type: "consult",
        href: "/patient/appointments",
      });
      if (booking.physioId !== booking.patientId) {
        addNotification({
          userId: booking.physioId,
          title: urgent30 ? "Visit in 30 minutes" : windowKey === "1h" ? "Visit in 1 hour" : "Visit in 24 hours",
          body: `${booking.patientName} · ${booking.reason}`,
          type: "consult",
          href: "/doctor/appointments",
        });
      }
      markBookingReminder(booking.id, windowKey);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("PhysioFlow reminder", { body });
      }
      // Server push when the app tab may be closed later — best-effort while online.
      if (navigator.onLine) {
        void notifyFcm({
          userId: booking.patientId,
          title,
          body,
          href: "/patient/appointments",
        });
      }
    }
  }, [addNotification, markBookingReminder, state.bookings, state.currentUserId]);

  return null;
}
