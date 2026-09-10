import { sendPlainEmail } from "@/lib/server/mail";
import { sendSms, smsConfigured } from "@/lib/server/sms";
import { digestOtp } from "@/lib/server/otp-digest";
import { canSignServerPayload, signJson } from "@/lib/server/signed-json";
import { NextRequest } from "next/server";

/** OTP lifetime and resend cooldown (kept in sync with the client hook). */
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_RESEND_MS = 30 * 1000;

export async function POST(request: NextRequest) {
  if (!canSignServerPayload()) {
    return Response.json(
      { error: "OTP is not configured. Set OTP_SECRET (or ADMIN_SESSION_SECRET)." },
      { status: 503 },
    );
  }
  let body: { email?: string; phone?: string; purpose?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  if (!email.includes("@")) {
    return Response.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const exp = Date.now() + OTP_TTL_MS;
  const challengeToken = await signJson({
    email,
    purpose: body.purpose ?? "register",
    hash: await digestOtp(email, code),
    exp,
  });

  const text = `Your PhysioFlow verification code is ${code}. It expires in 5 minutes. Do not share this code.`;
  let channel: "sms" | "email" = phone ? "sms" : "email";
  let delivered = false;

  if (phone && smsConfigured()) {
    try {
      const result = await sendSms({ to: phone, text });
      delivered = result.sent;
      channel = "sms";
    } catch (err) {
      console.error("[otp] SMS delivery failed, falling back to email", err);
    }
  }

  if (!delivered && email) {
    const result = await sendPlainEmail({
      to: email,
      subject: "Your PhysioFlow verification code",
      text: `${text}\n\nIf you did not request this, ignore this message.`,
    });
    if (result.sent) {
      delivered = true;
      channel = "email";
    }
  }

  if (!delivered) {
    // No real provider is configured — log the code and expose it to the client
    // so local development can complete the flow. Never happens in production
    // with a configured SMS/email provider.
    console.info(`[otp:dev] code for ${phone || email}: ${code}`);
  }

  return Response.json({
    challengeToken,
    channel,
    resendAfterMs: OTP_RESEND_MS,
    expiresInMs: OTP_TTL_MS,
    // Only present when nothing could actually be delivered (dev/no provider).
    devCode: delivered ? undefined : code,
  });
}
