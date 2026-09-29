/** Bilingual copy matches the registration error already shown on Preview. */
export const OTP_EMAIL_UNAVAILABLE =
  "Email verification is unavailable. No code was sent. / ईमेल सेवा उपलब्ध नहीं है। कोड नहीं भेजा गया।";

/**
 * Preview deployments and an explicit opt-in may finish registration without a
 * delivered email. Production stays closed unless this flag is set on purpose.
 */
export function otpDevFallbackEnabled(env: {
  OTP_DEV_FALLBACK?: string;
  VERCEL_ENV?: string;
} = process.env) {
  return env.OTP_DEV_FALLBACK === "true" || env.VERCEL_ENV === "preview";
}

export type OtpDelivery =
  | { status: 200; body: { challengeToken: string; devCode?: string; hint?: string } }
  | { status: 503; body: { error: string } };

export function otpDeliveryResponse(input: {
  sent: boolean;
  resendConfigured: boolean;
  fallback: boolean;
  code: string;
  challengeToken: string;
}): OtpDelivery {
  if (input.sent) {
    return { status: 200, body: { challengeToken: input.challengeToken } };
  }

  if (input.fallback) {
    return {
      status: 200,
      body: {
        challengeToken: input.challengeToken,
        devCode: input.code,
        hint: `Email was not sent. Use this verification code: ${input.code}. It expires in 30 minutes. / ईमेल नहीं भेजा गया। यह सत्यापन कोड इस्तेमाल करें: ${input.code}. यह 30 मिनट में समाप्त हो जाएगा।`,
      },
    };
  }

  if (input.resendConfigured) {
    return { status: 503, body: { error: OTP_EMAIL_UNAVAILABLE } };
  }

  return {
    status: 200,
    body: {
      challengeToken: input.challengeToken,
      hint: "Email provider is not set. Check the server log for the code.",
    },
  };
}
