import type { PaymentOrderRecord } from "@/lib/pricing";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { canSignServerPayload, signJson, unsignJson } from "@/lib/server/signed-json";

/** Soft cache only — Firestore `payment_orders` is the source of truth when Admin SDK is configured. */
const g = globalThis as typeof globalThis & { __pfPaymentOrders?: Map<string, PaymentOrderRecord> };

function cache() {
  if (!g.__pfPaymentOrders) g.__pfPaymentOrders = new Map();
  return g.__pfPaymentOrders;
}

export async function persistPaymentToken(record: PaymentOrderRecord) {
  if (!canSignServerPayload()) return "";
  return signJson(record);
}

export async function recordFromToken(token?: string) {
  if (!token) return undefined;
  return unsignJson<PaymentOrderRecord>(token);
}

export async function savePaymentOrder(record: PaymentOrderRecord) {
  const db = await getAdminDb();
  if (db) {
    try {
      await db.collection("payment_orders").doc(record.orderId).set(
        {
          ...record,
          updatedAt: new Date().toISOString(),
          serverUpdatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err) {
      console.warn("[payment-orders]", err instanceof Error ? err.message : err);
    }
  }
  cache().set(record.orderId, record);
}

export async function getPaymentOrder(orderId: string, token?: string) {
  const db = await getAdminDb();
  if (db) {
    const snap = await db.collection("payment_orders").doc(orderId).get();
    if (snap.exists) {
      const record = snap.data() as unknown as PaymentOrderRecord;
      cache().set(orderId, record);
      return record;
    }
  }

  const memory = cache().get(orderId);
  if (memory) return memory;

  const signed = await recordFromToken(token);
  if (signed?.orderId === orderId) {
    cache().set(orderId, signed);
    return signed;
  }
  return undefined;
}

export async function markOrderPaid(orderId: string, paymentId: string, paymentMethod?: string, token?: string) {
  const current = await getPaymentOrder(orderId, token);
  if (!current) return undefined;
  if (current.paymentStatus === "success" && current.paymentId === paymentId) {
    return current;
  }
  const next: PaymentOrderRecord = {
    ...current,
    paymentStatus: "success",
    paymentId,
    paymentMethod: paymentMethod ?? current.paymentMethod ?? "razorpay",
    paidAt: current.paidAt ?? new Date().toISOString(),
  };
  await savePaymentOrder(next);
  return next;
}

export async function markOrderFailed(orderId: string) {
  const current = await getPaymentOrder(orderId);
  if (!current || current.paymentStatus === "success") return current;
  const next: PaymentOrderRecord = { ...current, paymentStatus: "failed" };
  await savePaymentOrder(next);
  return next;
}

export function paymentOrdersAreDurable() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) || canSignServerPayload();
}
