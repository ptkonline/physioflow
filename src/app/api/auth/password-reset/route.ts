import { getAdminAuth } from "@/lib/server/firebase-admin";
import { sendPlainEmail } from "@/lib/server/mail";
import { NextRequest } from "next/server";

const WINDOW_MS = 60_000;
const recent = new Map<string, number>();

function throttled(key: string) {
  const now = Date.now();
  const prev = recent.get(key) ?? 0;
  if (now - prev < WINDOW_MS) return true;
  recent.set(key, now);
  if (recent.size > 400) {
    for (const [entry, at] of recent) {
      if (now - at > WINDOW_MS) recent.delete(entry);
    }
  }
  return false;
}

function continueUrl(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.protocol === "http:") return `${url.origin}/login`;
    } catch {
      /* use the request host */
    }
  }
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0]?.trim();
  const originHeader = request.headers.get("origin");
  if (originHeader && host) {
    try {
      const origin = new URL(originHeader);
      if (origin.host === host && (origin.protocol === "https:" || origin.protocol === "http:")) {
        return `${origin.origin}/login`;
      }
    } catch {
      /* ignore a bad Origin */
    }
  }
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") === "http" ? "http" : "https";
    return `${proto}://${host}/login`;
  }
  return "http://localhost:3000/login";
}

function missingUser(err: unknown) {
  const code = err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : "";
  const message = err instanceof Error ? err.message : String(err ?? "");
  return code === "auth/user-not-found" || code === "auth/invalid-email" || /user-not-found|no user record/i.test(message);
}

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return Response.json({ ok: true });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email.includes("@") || email.length > 200) {
    return Response.json({ ok: true });
  }

  const ip = (request.headers.get("x-forwarded-for") || "local").split(",")[0]?.trim() || "local";
  if (throttled(`email:${email}`) || throttled(`ip:${ip}`)) {
    return Response.json({ ok: false, error: "Please wait a minute, then try again." }, { status: 429 });
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const auth = await getAdminAuth();
  if (!auth || !resendKey) {
    console.info("[password-reset] Resend path unavailable", {
      admin: Boolean(auth),
      resend: Boolean(resendKey),
    });
    return Response.json({ ok: true, fallback: true });
  }

  const url = continueUrl(request);
  try {
    const link = await auth.generatePasswordResetLink(email, { url, handleCodeInApp: false });
    await sendPlainEmail({
      to: email,
      subject: "Reset your PhysioFlow password",
      text: [
        "A password reset was requested for this PhysioFlow account.",
        "",
        "Open this link to choose a new password:",
        link,
        "",
        "If you did not ask for this, you can ignore the email. The link expires on its own.",
        "After you reset, sign in at the same site with the new password.",
      ].join("\n"),
    });
    console.info("[password-reset] sent via Resend", email);
  } catch (err) {
    if (missingUser(err)) {
      console.info("[password-reset] no Auth user for address", email);
    } else {
      console.error("[password-reset] Resend or Admin link failed", email, err instanceof Error ? err.message : err, { continueUrl: url });
    }
  }

  return Response.json({ ok: true });
}
