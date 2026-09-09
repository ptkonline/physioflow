import { notifyDoctorOfPayment, notifyPatientOfPayment } from "@/lib/server/payment-notify";
import { getPaymentOrder, markOrderPaid } from "@/lib/server/payment-orders";
import { isRazorpayConfigured, verifyCheckoutSignature } from "@/lib/server/razorpay";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  let body: {
    orderId?: string;
    paymentId?: string;
    signature?: string;
    paymentMethod?: string;
    persistenceToken?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = String(body.orderId ?? "");
  const paymentId = String(body.paymentId ?? "");
  const record = await getPaymentOrder(orderId, body.persistenceToken);
  if (!record) {
    return Response.json({ error: "Unknown order. Start checkout again." }, { status: 404 });
  }

  if (record.paymentStatus === "success" && record.paymentId) {
    return Response.json({ ok: true, idempotent: true, order: record });
  }

  const demo = orderId.startsWith("demo_order_") && !isRazorpayConfigured();
  if (!demo) {
    const ok = verifyCheckoutSignature({
      orderId,
      paymentId,
      signature: String(body.signature ?? ""),
    });
    if (!ok) {
      return Response.json({ error: "Payment signature did not match." }, { status: 400 });
    }
  }

  const paid = await markOrderPaid(
    orderId,
    paymentId || `demo_pay_${orderId}`,
    body.paymentMethod ?? (demo ? "demo" : "razorpay"),
    body.persistenceToken,
  );
  if (!paid) {
    return Response.json({ error: "Could not record payment." }, { status: 500 });
  }

  const paymentRef = paid.paymentId ?? paymentId;
  await notifyDoctorOfPayment({
    doctorEmail: paid.draft.doctorEmail,
    doctorName: paid.draft.doctorName,
    patientName: paid.draft.patientName,
    scheduledAt: paid.draft.scheduledAt,
    amount: paid.quote.amount,
    paymentId: paymentRef,
    doctorId: paid.draft.doctorId,
  });
  await notifyPatientOfPayment({
    patientEmail: paid.draft.patientEmail,
    patientName: paid.draft.patientName,
    doctorName: paid.draft.doctorName,
    scheduledAt: paid.draft.scheduledAt,
    bookingId: paid.orderId,
    paymentId: paymentRef,
    patientId: paid.draft.patientId,
  });

  return Response.json({ ok: true, idempotent: false, order: paid });
}
