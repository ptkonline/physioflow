import { ADMIN_COOKIE, readAdminToken } from "@/lib/admin-session";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { cookies } from "next/headers";

async function actor() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return readAdminToken(token);
}

export async function GET() {
  const session = await actor();
  if (!session) return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  const db = await getAdminDb();
  if (!db) {
    return Response.json({
      users: [],
      doctors: [],
      warning: "Set FIREBASE_SERVICE_ACCOUNT_JSON to list UAT accounts.",
    });
  }
  const admin = await import("firebase-admin");
  const [usersSnap, doctorsSnap] = await Promise.all([
    admin.firestore().collection("users").limit(200).get(),
    admin.firestore().collection("doctors_public").limit(200).get(),
  ]);
  const users = usersSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: String(data.name ?? ""),
      email: String(data.email ?? ""),
      role: String(data.role ?? ""),
    };
  });
  const doctors = doctorsSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      email: String(data.email ?? ""),
      specialty: String(data.specialty ?? ""),
      isVerified: Boolean(data.isVerified),
    };
  });
  return Response.json({ users, doctors });
}

export async function POST(request: Request) {
  const session = await actor();
  if (!session) return Response.json({ error: "Admin sign-in required." }, { status: 401 });
  const db = await getAdminDb();
  if (!db) return Response.json({ error: "Firebase Admin is not configured." }, { status: 503 });
  let body: { action?: string; userId?: string; isVerified?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const userId = String(body.userId ?? "").trim();
  if (!userId || userId === session.userId) {
    return Response.json({ error: "That account cannot be changed from here." }, { status: 400 });
  }
  const admin = await import("firebase-admin");
  const firestore = admin.firestore();
  if (body.action === "verify") {
    await firestore.collection("doctors_public").doc(userId).set({ isVerified: Boolean(body.isVerified) }, { merge: true });
    return Response.json({ ok: true });
  }
  if (body.action === "delete") {
    await firestore.collection("users").doc(userId).delete().catch(() => undefined);
    await firestore.collection("doctors_public").doc(userId).delete().catch(() => undefined);
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Unknown action." }, { status: 400 });
}
