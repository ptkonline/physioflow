import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    applicationId?: string;
    name?: string;
    email?: string;
    phone?: string;
    specialization?: string;
    registrationNumber?: string;
  };

  if (!payload.applicationId || !payload.name || !payload.email) {
    return Response.json({ error: "Missing application details" }, { status: 400 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM_EMAIL || "PhysioFlow <noreply@resend.dev>";

  const text = [
    "A doctor has submitted documents for verification.",
    "",
    `Application ID: ${payload.applicationId}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone ?? "—"}`,
    `Specialization: ${payload.specialization ?? "—"}`,
    `Registration number: ${payload.registrationNumber ?? "—"}`,
    "",
    "Collection: doctors_pending_verification (status: pending)",
  ].join("\n");

  if (!adminEmail || !resendKey) {
    console.info("[notify-admin]", text);
    return Response.json({
      sent: false,
      queued: true,
      hint: "Set ADMIN_EMAIL and RESEND_API_KEY to send live admin mail.",
    });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [adminEmail],
      subject: `Doctor verification pending: ${payload.name}`,
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return Response.json({ error: `Email provider rejected the message: ${detail}` }, { status: 502 });
  }

  return Response.json({ sent: true });
}
