import { ADMIN_COOKIE, adminEnv, createAdminToken } from "@/lib/admin-session";
import { cookies } from "next/headers";

type LookupUser = { email?: string; localId?: string };

async function lookupIdToken(idToken: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!apiKey) return null;
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { users?: LookupUser[] };
  const user = body.users?.[0];
  const email = user?.email?.trim().toLowerCase();
  const uid = user?.localId?.trim();
  if (!email || !uid) return null;
  return { email, uid };
}

export async function POST(request: Request) {
  const env = adminEnv();
  if (!env.ready) {
    return Response.json(
      { error: "Admin sign-in is not configured. Set ADMIN_EMAIL, ADMIN_UID, and ADMIN_SESSION_SECRET." },
      { status: 503 },
    );
  }
  let idToken = "";
  try {
    const body = (await request.json()) as { idToken?: string };
    idToken = String(body.idToken ?? "");
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!idToken) return Response.json({ error: "Sign in with email and password first." }, { status: 400 });

  const account = await lookupIdToken(idToken);
  if (!account) {
    return Response.json({ error: "Firebase could not confirm that sign-in." }, { status: 401 });
  }
  const token = await createAdminToken({ email: account.email, userId: account.uid });
  if (!token) {
    return Response.json(
      { error: "This account is not the configured clinic admin." },
      { status: 403 },
    );
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return Response.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).delete(ADMIN_COOKIE);
  return Response.json({ ok: true });
}
