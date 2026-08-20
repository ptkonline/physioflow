"use client";

import { formatInr, type FeeQuote } from "@/lib/pricing";

export function FeeBreakdown({ quote }: { quote: FeeQuote }) {
  return (
    <dl className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-line">
      <div className="flex justify-between">
        <dt className="text-muted">Consultation fee</dt>
        <dd>{formatInr(quote.consultationFee)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">Platform fee</dt>
        <dd>{formatInr(quote.platformFee)}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-2 font-semibold">
        <dt>Total</dt>
        <dd>{formatInr(quote.amount)}</dd>
      </div>
    </dl>
  );
}
