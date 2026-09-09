import { digestOtp } from "@/lib/server/otp-digest";
import { unsignJson } from "@/lib/server/signed-json";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string; challengeToken?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const code = String(body.code ?? "").replace(/\D/g, "");
  const token = String(body.challengeToken ?? "");
  const payload = await unsignJson<{ email: string; hash: string; exp: number }>(token);
  if (!payload || payload.email !== email) {
    return Response.json({ error: "This code has expired. Request a new one." }, { status: 400 });
  }
  if (payload.exp < Date.now()) {
    return Response.json({ error: "This code has expired. Request a new one." }, { status: 400 });
  }
  if ((await digestOtp(email, code)) !== payload.hash) {
    return Response.json({ error: "That code is not valid." }, { status: 400 });
  }
  return Response.json({ ok: true });
}
