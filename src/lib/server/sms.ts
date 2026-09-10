/**
 * Minimal SMS delivery used for phone OTP. Supports Twilio and MSG91 via
 * environment variables. When neither is configured, the message is logged to
 * the server console (dev fallback) and `sent` is false so callers can surface
 * the code in the UI for local development.
 *
 * Twilio:  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM
 *          (or TWILIO_MESSAGING_SERVICE_SID)
 * MSG91:   MSG91_AUTHKEY, MSG91_SENDER (6-char sender id), optional MSG91_ROUTE
 */

export type SmsResult = { sent: boolean; provider: "twilio" | "msg91" | "console" };

function twilioEnv() {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM?.trim();
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  if (sid && token && (from || messagingServiceSid)) {
    return { sid, token, from, messagingServiceSid };
  }
  return null;
}

function msg91Env() {
  const authkey = process.env.MSG91_AUTHKEY?.trim();
  const sender = process.env.MSG91_SENDER?.trim();
  if (authkey && sender) {
    return { authkey, sender, route: process.env.MSG91_ROUTE?.trim() || "4" };
  }
  return null;
}

/** True when a real SMS provider is configured and can deliver messages. */
export function smsConfigured() {
  return Boolean(twilioEnv() || msg91Env());
}

function digitsOnly(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export async function sendSms(input: { to: string; text: string }): Promise<SmsResult> {
  const to = input.to.trim();

  const twilio = twilioEnv();
  if (twilio) {
    const params = new URLSearchParams();
    params.set("To", to);
    if (twilio.messagingServiceSid) params.set("MessagingServiceSid", twilio.messagingServiceSid);
    else params.set("From", twilio.from as string);
    params.set("Body", input.text);
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${twilio.sid}:${twilio.token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) throw new Error(`Twilio SMS failed: ${await res.text()}`);
    return { sent: true, provider: "twilio" };
  }

  const msg91 = msg91Env();
  if (msg91) {
    const url = new URL("https://api.msg91.com/api/sendhttp.php");
    url.searchParams.set("authkey", msg91.authkey);
    url.searchParams.set("mobiles", digitsOnly(to));
    url.searchParams.set("message", input.text);
    url.searchParams.set("sender", msg91.sender);
    url.searchParams.set("route", msg91.route);
    url.searchParams.set("country", "0");
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`MSG91 SMS failed: ${await res.text()}`);
    return { sent: true, provider: "msg91" };
  }

  console.info("[sms:dev]", to, "\n", input.text);
  return { sent: false, provider: "console" };
}
