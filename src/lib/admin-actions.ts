"use server";

import { ADMIN_COOKIE, adminEnv, createAdminToken, readAdminToken } from "@/lib/admin-session";
import { cookies } from "next/headers";

export async function issueAdminSession(input: { email: string; userId: string }) {
  const env = adminEnv();
  const jar = await cookies();
  if (!env.ready) {
    jar.delete(ADMIN_COOKIE);
    return { admin: false as const };
  }
  const token = await createAdminToken(input);
  if (!token) {
    jar.delete(ADMIN_COOKIE);
    return { admin: false as const };
  }
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return { admin: true as const };
}

export async function revokeAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

async function adminActor() {
  const env = adminEnv();
  if (!env.ready) return null;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return readAdminToken(token);
}

export async function adminDeleteUser(userId: string) {
  const session = await adminActor();
  const id = userId.trim();
  if (!session || !id || id === session.userId) {
    return { ok: false as const };
  }
  return { ok: true as const, userId: id };
}

export async function adminSetDoctorVerified(doctorId: string, isVerified: boolean) {
  const session = await adminActor();
  const id = doctorId.trim();
  if (!session || !id) {
    return { ok: false as const };
  }
  return { ok: true as const, doctorId: id, isVerified: Boolean(isVerified) };
}
