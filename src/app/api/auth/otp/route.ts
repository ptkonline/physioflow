import { sendPlainEmail } from "@/lib/server/mail";
import { digestOtp } from "@/lib/server/otp-digest";
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
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const exp = Date.now() + 10 * 60 * 1000;
  const challengeToken = await signJson({
    email,
    purpose: body.purpose ?? "register",
    hash: await digestOtp(email, code),
    exp,
  });
  await sendPlainEmail({
    to: email,
    subject: "Your PhysioFlow verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes.\n\nIf you did not request this, ignore the email.`,
  });
  return Response.json({
    challengeToken,
    hint: process.env.RESEND_API_KEY ? undefined : "Email provider is not set. Check the server log for the code.",
  });
}
