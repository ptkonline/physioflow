import { parseDraft } from "@/lib/server/payment-notify";
import { persistPaymentToken, savePaymentOrder } from "@/lib/server/payment-orders";
import { createRazorpayOrder, isRazorpayConfigured, razorpayKeyId } from "@/lib/server/razorpay";
import { quoteFees } from "@/lib/pricing";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const draft = parseDraft(body);
  if (!draft) {
    return Response.json({ error: "Missing doctor, patient, or appointment time." }, { status: 400 });
  }

  const quote = quoteFees(draft.doctorId, undefined, draft.mode ?? "online", {
    onlineFee: draft.onlineFee,
    offlineFee: draft.offlineFee,
  });
  const receipt = `pf_${Date.now().toString(36)}`.slice(0, 40);

  if (!isRazorpayConfigured()) {
    const orderId = `demo_order_${receipt}`;
    const record = {
      orderId,
      receipt,
      quote,
      draft,
      paymentStatus: "pending" as const,
    };
    await savePaymentOrder(record);
    return Response.json({
      demo: true,
      orderId,
      keyId: "",
      quote,
      persistenceToken: await persistPaymentToken(record),
    });
  }

  try {
    const orderId = await createRazorpayOrder({
      amountPaise: quote.amountPaise,
      currency: quote.currency,
      receipt,
      notes: {
        doctorId: draft.doctorId,
        patientId: draft.patientId,
        scheduledAt: draft.scheduledAt,
      },
    });
    const record = {
      orderId,
      receipt,
      quote,
      draft,
      paymentStatus: "pending" as const,
    };
    await savePaymentOrder(record);
    return Response.json({
      demo: false,
      orderId,
      keyId: razorpayKeyId(),
      quote,
      persistenceToken: await persistPaymentToken(record),
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Could not start payment." },
      { status: 502 },
    );
  }
}
