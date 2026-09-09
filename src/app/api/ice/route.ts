import { NextResponse } from "next/server";

const STUN: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

export async function GET() {
  const iceServers: RTCIceServer[] = [...STUN];
  const urls = (process.env.TURN_URLS || process.env.TURN_URL || process.env.NEXT_PUBLIC_TURN_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const username = process.env.TURN_USERNAME || process.env.NEXT_PUBLIC_TURN_USERNAME;
  const credential = process.env.TURN_CREDENTIAL || process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
  if (urls.length) {
    iceServers.push({
      urls,
      username: username || undefined,
      credential: credential || undefined,
    });
  }
  return NextResponse.json({
    iceServers,
    turnReady: urls.length > 0,
  });
}
