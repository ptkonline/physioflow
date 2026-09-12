import type { Booking } from "./types";

/** Minutes before start and after end when the visit can be started/joined. */
export const CALL_WINDOW_BEFORE_MIN = 15;
export const CALL_WINDOW_AFTER_MIN = 15;
export const MISSED_CALL_MS = 3 * 60 * 1000;

export function bookingCallBounds(booking: Pick<Booking, "scheduledAt" | "durationMin">) {
  const start = Date.parse(booking.scheduledAt);
  const duration = Math.max(15, booking.durationMin || 30) * 60 * 1000;
  const openAt = start - CALL_WINDOW_BEFORE_MIN * 60 * 1000;
  const closeAt = start + duration + CALL_WINDOW_AFTER_MIN * 60 * 1000;
  return { start, openAt, closeAt };
}

export function isCallWindowOpen(booking: Pick<Booking, "scheduledAt" | "durationMin" | "status" | "mode">, now = Date.now()) {
  if (booking.status !== "upcoming" && booking.status !== "completed") return false;
  if (booking.mode === "offline") return false;
  const { openAt, closeAt } = bookingCallBounds(booking);
  return now >= openAt && now <= closeAt;
}

export function callWindowHint(booking: Pick<Booking, "scheduledAt" | "durationMin" | "mode" | "status">, now = Date.now()) {
  if (booking.mode === "offline") return "Clinic visits do not have a video room.";
  if (booking.status === "cancelled") return "This booking was cancelled.";
  const { openAt, closeAt } = bookingCallBounds(booking);
  if (now < openAt) {
    return `Video opens ${CALL_WINDOW_BEFORE_MIN} minutes before the visit (${new Date(openAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}).`;
  }
  if (now > closeAt) return "The video window for this visit has closed.";
  return "";
}

export function consultHref(consultId: string) {
  return `/consult/${consultId}`;
}
