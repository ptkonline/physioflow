import { sendPlainEmail } from "@/lib/server/mail";
import { digestOtp } from "@/lib/server/otp-digest";
import { otpDeliveryResponse, otpDevFallbackEnabled } from "@/lib/server/otp-email-policy";
import { canSignServerPayload, signJson } from "@/lib/server/signed-json";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  if (!canSignServerPayload()) {
    return Response.json(
      { error: "OTP is not configured. Set ADMIN_SESSION_SECRET or OTP_SECRET." },
      { status: 503 },
    );
  }
  let body: { email?: string; purpose?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email.includes("@")) {
    return Response.json({ error: "Enter a valid email." }, { status: 400 });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000)).padStart(6, "0");
  const exp = Date.now() + 30 * 60 * 1000;
  const challengeToken = await signJson({
    email,
    purpose: body.purpose ?? "register",
    hash: await digestOtp(email, code),
    exp,
  });
  let sent = false;
  try {
    const result = await sendPlainEmail({
      to: email,
      subject: "Your PhysioFlow verification code",
      text: `Your PhysioFlow verification code is ${code}. It is 6 digits and expires in 30 minutes.\n\nIf you did not request this, ignore the email.`,
    });
    sent = result.sent;
  } catch (err) {
    console.error("[otp] email send failed", err instanceof Error ? err.message : err);
  }

  const delivery = otpDeliveryResponse({
    sent,
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
    fallback: otpDevFallbackEnabled(),
    code,
    challengeToken,
  });

  if (delivery.status === 200 && delivery.body.devCode) {
    console.info(`[otp:dev] verification code for ${email}: ${delivery.body.devCode}`);
  }

  return Response.json(delivery.body, { status: delivery.status });
}
