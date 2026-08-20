"use client";

import { useStore } from "@/lib/store";
import { useEffect } from "react";

const HOUR = 60 * 60 * 1000;

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
      if (!reminderWindow) continue;
      const key = `physioflow.reminder.${booking.id}.${reminderWindow}`;
      if (sessionStorage.getItem(key)) continue;
      sessionStorage.setItem(key, "1");
      const when = reminderWindow === "1h" ? "in about an hour" : "tomorrow";
      addNotification({
        userId: booking.patientId,
        title: reminderWindow === "1h" ? "Appointment in 1 hour" : "Appointment in 24 hours",
        body: `${booking.reason} ${when}.`,
        type: "consult",
        href: "/patient/appointments",
      });
      if (booking.physioId !== booking.patientId) {
        addNotification({
          userId: booking.physioId,
          title: reminderWindow === "1h" ? "Visit in 1 hour" : "Visit in 24 hours",
          body: `${booking.patientName} · ${booking.reason}`,
          type: "consult",
          href: "/doctor/appointments",
        });
      }
      markBookingReminder(booking.id, reminderWindow);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("PhysioFlow reminder", { body: `${booking.reason} ${when}` });
      }
    }
  }, [addNotification, markBookingReminder, state.bookings, state.currentUserId]);

  return null;
}
