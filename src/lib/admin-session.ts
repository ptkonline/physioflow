const encoder = new TextEncoder();

export const ADMIN_COOKIE = "pf_admin";

export function adminEnv() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const uid = (process.env.ADMIN_UID ?? "").trim();
  const secret = (process.env.ADMIN_SESSION_SECRET ?? "").trim();
  return {
    email,
    uid,
    secret,
    ready: Boolean(email && uid && secret),
  };
}

export function safeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const buf = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function b64url(value: string) {
  const bytes = encoder.encode(value);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromB64url(value: string) {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const bin = atob(value.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return [...bin].map((c) => c.charCodeAt(0));
}

export async function createAdminToken(input: { email: string; userId: string }) {
  const env = adminEnv();
  if (!env.ready) return null;
  const email = input.email.trim().toLowerCase();
  if (!safeEqual(email, env.email) || !safeEqual(input.userId, env.uid)) return null;
  const exp = Date.now() + 12 * 60 * 60 * 1000;
  const payload = b64url(JSON.stringify({ e: email, u: input.userId, exp }));
  const sig = await hmacHex(env.secret, payload);
  return `${payload}.${sig}`;
}

export async function readAdminToken(token: string | undefined) {
  const env = adminEnv();
  if (!env.ready || !token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacHex(env.secret, payload);
  if (!safeEqual(sig, expected)) return null;
  try {
    const json = JSON.parse(new TextDecoder().decode(Uint8Array.from(fromB64url(payload)))) as {
      e?: string;
      u?: string;
      exp?: number;
    };
    if (!json.e || !json.u || !json.exp || json.exp < Date.now()) return null;
    if (!safeEqual(json.e, env.email) || !safeEqual(json.u, env.uid)) return null;
    return { email: json.e, userId: json.u };
  } catch {
    return null;
  }
}

export function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
