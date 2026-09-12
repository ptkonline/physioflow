"use client";

function mmss(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function OtpChallenge({
  code,
  onCodeChange,
  channel,
  devCode,
  resendIn,
  expiresIn,
  expired,
  onResend,
}: {
  code: string;
  onCodeChange: (value: string) => void;
  channel: "sms" | "email" | "";
  devCode: string | null;
  resendIn: number;
  expiresIn: number;
  expired: boolean;
  onResend: () => void;
}) {
  const destination = channel === "sms" ? "your phone" : channel === "email" ? "your email" : "you";
  return (
    <div className="space-y-2 rounded-2xl border border-line bg-sage/30 p-4">
      <label className="block space-y-1">
        <span>Verification code</span>
        <p className="text-sm text-muted">We sent a 6-digit code to {destination}. Enter it below to verify.</p>
        <input
          className="field tracking-[0.4em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="______"
          required
        />
      </label>
      {devCode && (
        <p className="text-sm text-amber">
          Dev mode: no SMS/email provider is configured, so your code is{" "}
          <strong className="tracking-widest">{devCode}</strong>.
        </p>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className={expired ? "text-rose" : "text-muted"}>
          {expired ? "Code expired — request a new one." : `Expires in ${mmss(expiresIn)}`}
        </span>
        <button
          type="button"
          className="btn btn-ghost px-3 py-1"
          onClick={onResend}
          disabled={resendIn > 0}
        >
          {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}
