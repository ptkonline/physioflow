const encoder = new TextEncoder();

function signingSecret() {
  const configured =
    process.env.PAYMENT_SIGNING_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.OTP_SECRET?.trim() ||
    "";
  if (configured) return configured;
  // Outside production, fall back to a fixed dev secret so the OTP flow works
  // without extra configuration. Production still requires a real secret.
  if (process.env.NODE_ENV !== "production") {
    return "physioflow-dev-insecure-signing-secret";
  }
  return "";
}

export function canSignServerPayload() {
  return Boolean(signingSecret());
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
  const pad = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = pad + "=".repeat((4 - (pad.length % 4)) % 4);
  return atob(padded);
}

export async function signJson(payload: unknown) {
  const secret = signingSecret();
  if (!secret) throw new Error("Missing PAYMENT_SIGNING_SECRET or ADMIN_SESSION_SECRET.");
  const body = JSON.stringify(payload);
  const sig = await hmacHex(secret, body);
  return `${b64url(body)}.${sig}`;
}

export async function unsignJson<T>(token: string): Promise<T | null> {
  const secret = signingSecret();
  if (!secret || !token.includes(".")) return null;
  const dot = token.lastIndexOf(".");
  const body = fromB64url(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  const expected = await hmacHex(secret, body);
  if (expected.length !== sig.length) return null;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (mismatch) return null;
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}
