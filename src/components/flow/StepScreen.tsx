"use client";

import type { ReactNode } from "react";

export function StepScreen({
  step,
  total,
  title,
  hint,
  children,
  onBack,
  backLabel,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  busy,
}: {
  step: number;
  total: number;
  title: string;
  hint?: string;
  children: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  busy?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="step-track" aria-hidden>
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className={index < step ? "is-done" : index + 1 === step ? "is-current" : ""} />
        ))}
      </div>
      <p className="text-sm font-semibold text-teal">
        {step} / {total}
      </p>
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        {hint && <p className="mt-1 text-muted">{hint}</p>}
      </div>
      {children}
      <div className="flow-actions">
        {onBack && (
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            {backLabel}
          </button>
        )}
        {primaryLabel && onPrimary && (
          <button type="button" className="btn btn-primary flow-next" disabled={primaryDisabled || busy} onClick={onPrimary}>
            {busy ? "…" : primaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
