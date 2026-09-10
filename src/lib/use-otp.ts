"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type OtpResult = { ok: boolean; error?: string };

type RequestInput = { email: string; phone?: string; purpose?: string };

/**
 * Drives a phone/email OTP challenge: request a code, track the resend cooldown
 * and expiry countdown, and verify the entered code. Delivery (SMS/email) is
 * handled server-side; in local dev without a provider the server returns a
 * `devCode` which is surfaced to the user.
 */
export function useOtp() {
  const [awaiting, setAwaiting] = useState(false);
  const [challenge, setChallenge] = useState("");
  const [channel, setChannel] = useState<"sms" | "email" | "">("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const lastRequest = useRef<RequestInput | null>(null);

  useEffect(() => {
    if (resendIn <= 0 && expiresIn <= 0) return;
    const id = setInterval(() => {
      setResendIn((s) => (s > 0 ? s - 1 : 0));
      setExpiresIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [resendIn, expiresIn]);

  const request = useCallback(async (input: RequestInput): Promise<OtpResult> => {
    lastRequest.current = input;
    let res: Response;
    try {
      res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    } catch {
      return { ok: false, error: "Network error. Try again." };
    }
    const body = (await res.json()) as {
      error?: string;
      challengeToken?: string;
      channel?: "sms" | "email";
      resendAfterMs?: number;
      expiresInMs?: number;
      devCode?: string;
    };
    if (!res.ok || !body.challengeToken) {
      return { ok: false, error: body.error || "Could not send the verification code." };
    }
    setChallenge(body.challengeToken);
    setChannel(body.channel ?? "");
    setDevCode(body.devCode ?? null);
    setResendIn(Math.ceil((body.resendAfterMs ?? 30000) / 1000));
    setExpiresIn(Math.ceil((body.expiresInMs ?? 300000) / 1000));
    setAwaiting(true);
    return { ok: true };
  }, []);

  const resend = useCallback(async (): Promise<OtpResult> => {
    if (resendIn > 0 || !lastRequest.current) {
      return { ok: false, error: `Wait ${resendIn}s before resending.` };
    }
    return request(lastRequest.current);
  }, [request, resendIn]);

  const verify = useCallback(
    async (input: { email: string; code: string }): Promise<OtpResult> => {
      if (expiresIn <= 0) {
        return { ok: false, error: "This code has expired. Resend a new one." };
      }
      let res: Response;
      try {
        res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, challengeToken: challenge }),
        });
      } catch {
        return { ok: false, error: "Network error. Try again." };
      }
      const body = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !body.ok) {
        return { ok: false, error: body.error || "That code is not valid." };
      }
      return { ok: true };
    },
    [challenge, expiresIn],
  );

  const reset = useCallback(() => {
    setAwaiting(false);
    setChallenge("");
    setChannel("");
    setDevCode(null);
    setResendIn(0);
    setExpiresIn(0);
    lastRequest.current = null;
  }, []);

  return {
    awaiting,
    channel,
    devCode,
    resendIn,
    expiresIn,
    canResend: resendIn <= 0,
    expired: awaiting && expiresIn <= 0,
    request,
    resend,
    verify,
    reset,
  };
}
