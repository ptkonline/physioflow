import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OTP_EMAIL_UNAVAILABLE, otpDeliveryResponse, otpDevFallbackEnabled } from "./otp-email-policy.ts";

const base = { code: "012345", challengeToken: "tok" };

describe("otpDevFallbackEnabled", () => {
  it("turns on for Vercel Preview", () => {
    assert.equal(otpDevFallbackEnabled({ VERCEL_ENV: "preview" }), true);
  });

  it("turns on when OTP_DEV_FALLBACK=true, including production", () => {
    assert.equal(otpDevFallbackEnabled({ VERCEL_ENV: "production", OTP_DEV_FALLBACK: "true" }), true);
  });

  it("stays off for production and other values", () => {
    assert.equal(otpDevFallbackEnabled({ VERCEL_ENV: "production" }), false);
    assert.equal(otpDevFallbackEnabled({ VERCEL_ENV: "development" }), false);
    assert.equal(otpDevFallbackEnabled({ OTP_DEV_FALLBACK: "false" }), false);
    assert.equal(otpDevFallbackEnabled({}), false);
  });
});

describe("otpDeliveryResponse", () => {
  it("returns only the challenge token when email was sent", () => {
    const res = otpDeliveryResponse({ ...base, sent: true, resendConfigured: true, fallback: true });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { challengeToken: "tok" });
  });

  it("returns the code when Preview or the fallback flag cannot send", () => {
    const res = otpDeliveryResponse({ ...base, sent: false, resendConfigured: true, fallback: true });
    assert.equal(res.status, 200);
    if (res.status !== 200) return;
    assert.equal(res.body.devCode, "012345");
    assert.match(res.body.hint ?? "", /012345/);
    assert.match(res.body.hint ?? "", /ईमेल नहीं भेजा गया/);
  });

  it("blocks production when Resend is configured and the send fails", () => {
    const res = otpDeliveryResponse({ ...base, sent: false, resendConfigured: true, fallback: false });
    assert.equal(res.status, 503);
    assert.deepEqual(res.body, { error: OTP_EMAIL_UNAVAILABLE });
  });

  it("keeps the log-only hint when production has no email provider", () => {
    const res = otpDeliveryResponse({ ...base, sent: false, resendConfigured: false, fallback: false });
    assert.equal(res.status, 200);
    if (res.status !== 200) return;
    assert.equal(res.body.devCode, undefined);
    assert.equal(res.body.hint, "Email provider is not set. Check the server log for the code.");
  });
});
