import { isFirebaseConfigured } from "./firebase-config";
import { registerPushToken } from "./fcm";

/** Register FCM on mount and return the device token (or null). */
export async function ensurePushToken(userId: string, email: string) {
  return registerPushToken(userId, email);
}

/** Ask the server to deliver an FCM push to a user (by userId or raw token). */
export async function notifyFcm(input: {
  userId?: string;
  token?: string;
  title: string;
  body: string;
  href?: string;
}) {
  if (!isFirebaseConfigured() && !input.token) return { sent: false as const };
  try {
    const res = await fetch("/api/notify-fcm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return { sent: false as const };
    return (await res.json()) as { sent: boolean };
  } catch {
    return { sent: false as const };
  }
}
