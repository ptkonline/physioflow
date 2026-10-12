/** Email OTP for signup. Off unless explicitly enabled. UAT Aja is password-only. */
export function isAuthOtpEnabled() {
  return process.env.AUTH_OTP_ENABLED === "true";
}

/** Phone / SMS OTP. Not purchased for Aja. Stays off unless explicitly enabled. */
export function isPhoneOtpEnabled() {
  return process.env.PHONE_OTP_ENABLED === "true";
}
