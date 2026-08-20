import { notifyDoctorOfPayment } from "@/lib/server/payment-notify";
import { getPaymentOrder, markOrderFailed, markOrderPaid } from "@/lib/server/payment-orders";
import { verifyWebhookSignature } from "@/lib/server/razorpay";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!verifyWebhookSignature(raw, signature)) {
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; method?: string; status?: string } };
      order?: { entity?: { id?: string } };
    };
  };
  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id || event.payload?.order?.entity?.id;
  if (!orderId) {
    return Response.json({ ok: true, ignored: true });
  }

  if (event.event === "payment.failed") {
    markOrderFailed(orderId);
    return Response.json({ ok: true });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const existing = getPaymentOrder(orderId);
    const paymentId = payment?.id ?? existing?.paymentId ?? `wh_${orderId}`;
    if (existing?.paymentStatus === "success") {
      return Response.json({ ok: true, idempotent: true });
    }
    const paid = markOrderPaid(orderId, paymentId, payment?.method);
    if (paid && paid.paymentStatus === "success") {
      await notifyDoctorOfPayment({
        doctorEmail: paid.draft.doctorEmail,
        doctorName: paid.draft.doctorName,
        patientName: paid.draft.patientName,
        scheduledAt: paid.draft.scheduledAt,
        amount: paid.quote.amount,
        paymentId: paid.paymentId ?? paymentId,
      });
    }
  }

  return Response.json({ ok: true });
}
