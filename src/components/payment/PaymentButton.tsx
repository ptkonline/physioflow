"use client";

import { FeeBreakdown } from "@/components/payment/FeeBreakdown";
import type { AppointmentDraft, FeeQuote } from "@/lib/pricing";
import { quoteFees } from "@/lib/pricing";
import { useEffect, useMemo, useState } from "react";

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckout = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
  }
}

function loadScript() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PaymentButton({
  draft,
  profileFee,
  onPaid,
}: {
  draft: AppointmentDraft;
  profileFee?: number;
  onPaid: (result: {
    quote: FeeQuote;
    paymentId: string;
    orderId: string;
    paymentMethod: string;
    paidAt: string;
  }) => void;
}) {
  const preview = useMemo(
    () =>
      quoteFees(draft.doctorId, profileFee, draft.mode ?? "online", {
        onlineFee: draft.onlineFee,
        offlineFee: draft.offlineFee,
      }),
    [draft.doctorId, draft.mode, draft.offlineFee, draft.onlineFee, profileFee],
  );
  const [quote, setQuote] = useState(preview);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setQuote(preview);
  }, [preview]);

  async function startPay() {
    setBusy(true);
    setError("");
    try {
      const created = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const order = (await created.json()) as {
        error?: string;
        demo?: boolean;
        orderId?: string;
        keyId?: string;
        quote?: FeeQuote;
        persistenceToken?: string;
      };
      if (!created.ok || !order.orderId || !order.quote) {
        throw new Error(order.error || "Could not start payment.");
      }
      setQuote(order.quote);
      const persistenceToken = order.persistenceToken;

      if (order.demo) {
        const verified = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.orderId,
            paymentId: `demo_pay_${order.orderId}`,
            signature: "demo",
            paymentMethod: "demo",
            persistenceToken,
          }),
        });
        const body = (await verified.json()) as { error?: string; order?: { paidAt?: string; paymentId?: string; quote: FeeQuote } };
        if (!verified.ok || !body.order) throw new Error(body.error || "Demo payment failed.");
        onPaid({
          quote: body.order.quote,
          paymentId: body.order.paymentId ?? `demo_pay_${order.orderId}`,
          orderId: order.orderId,
          paymentMethod: "demo",
          paidAt: body.order.paidAt ?? new Date().toISOString(),
        });
        return;
      }

      const ok = await loadScript();
      if (!ok || !window.Razorpay) throw new Error("Could not load Razorpay Checkout.");

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.quote.amountPaise,
        currency: order.quote.currency,
        name: "PhysioFlow",
        description: `Visit with ${draft.doctorName}`,
        order_id: order.orderId,
        prefill: {
          name: draft.patientName,
          email: draft.patientEmail,
          contact: draft.patientPhone,
        },
        handler: async (response: RazorpaySuccess) => {
          const verified = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              paymentMethod: "razorpay",
              persistenceToken,
            }),
          });
          const body = (await verified.json()) as {
            error?: string;
            order?: { paidAt?: string; paymentId?: string; quote: FeeQuote; paymentMethod?: string };
          };
          if (!verified.ok || !body.order) {
            setError(body.error || "Payment succeeded at the bank, but we could not confirm it yet. Refresh in a moment.");
            setBusy(false);
            return;
          }
          onPaid({
            quote: body.order.quote,
            paymentId: body.order.paymentId ?? response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            paymentMethod: body.order.paymentMethod ?? "razorpay",
            paidAt: body.order.paidAt ?? new Date().toISOString(),
          });
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setError("Payment was cancelled.");
          },
        },
      });
      checkout.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <FeeBreakdown quote={quote} />
      {error && <p className="text-rose">{error}</p>}
      <button className="btn btn-primary w-full" type="button" disabled={busy} onClick={() => void startPay()}>
        {busy ? "Processing payment…" : `Pay ${preview.currency} ${quote.amount}`}
      </button>
      <p className="text-xs text-muted">
        The amount is calculated on the server. Card details never touch PhysioFlow.
      </p>
    </div>
  );
}
