/**
 * Firestore collections used by PhysioFlow.
 *
 * videos/{videoId}
 * chats/{appointmentId}/messages/{messageId}
 * users/{uid} — profileImageUrl, locale, fcmToken
 * reviews/{reviewId}
 * prescriptions/{id}
 * daily_logs/{id} — one check-in per patient per calendar day
 * reminder_dispatches/{id} — 24h / 1h appointment reminders already sent
 * bookings/{id} (clinic appointments)
 *   paymentId, paymentStatus, amount, currency, paymentMethod, paidAt,
 *   razorpayOrderId, consultationFee, platformFee
 *
 * payment_orders are stored server-side (process memory / webhook idempotency),
 * not writable from the client.
 *
 * Storage:
 *   videos/{doctorId}/{videoId}/source|thumb
 *   doctors/{doctorId}/profile/{file}
 *   chats/{appointmentId}/{file}
 *   prescriptions/{doctorId}/{appointmentId}/{file}.pdf
 */

export const VIDEO_CATEGORIES = [
  "Knee Pain",
  "Back Stretch",
  "Shoulder Mobility",
  "Hip Stiffness",
  "Neck Tension",
  "Ankle Strength",
  "Post-op Recovery",
  "General Mobility",
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/x-m4v,.mp4,.mov,.m4v";
export const VIDEO_MAX_BYTES = 200 * 1024 * 1024;

export const LOCALES = ["en", "hi"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";
