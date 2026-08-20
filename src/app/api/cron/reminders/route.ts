import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    hint: "In-app reminders run in ReminderWatcher. Deploy functions/src/sendAppointmentReminders.ts for FCM/SMS.",
  });
}
