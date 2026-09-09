import { getAdminDb } from "@/lib/server/firebase-admin";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  let body: { userId?: string; token?: string; title?: string; body?: string; href?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const text = String(body.body ?? "").trim();
  if (!title || !text) {
    return Response.json({ error: "title and body are required" }, { status: 400 });
  }

  let token = String(body.token ?? "").trim();
  const userId = String(body.userId ?? "").trim();
  const db = await getAdminDb();

  if (!token && userId && db) {
    const snap = await db.collection("users").doc(userId).get();
    token = String(snap.data()?.fcmToken ?? "").trim();
  }

  if (!token) {
    return Response.json({ sent: false, hint: "No FCM token for this user." });
  }

  try {
    const admin = await import("firebase-admin");
    await admin.messaging().send({
      token,
      notification: { title, body: text },
      data: body.href ? { href: String(body.href) } : undefined,
    });
    return Response.json({ sent: true });
  } catch (err) {
    console.warn("[notify-fcm]", err instanceof Error ? err.message : err);
    return Response.json({ sent: false, error: "FCM send failed" }, { status: 502 });
  }
}
