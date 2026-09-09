import type { PaymentOrderRecord } from "@/lib/pricing";
import { getAdminDb } from "@/lib/server/firebase-admin";
import { canSignServerPayload, signJson, unsignJson } from "@/lib/server/signed-json";

const g = globalThis as typeof globalThis & { __pfPaymentOrders?: Map<string, PaymentOrderRecord> };

function orders() {
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
  orders().set(record.orderId, record);
  const db = await getAdminDb();
  if (!db) return;
  await db.collection("payment_orders").doc(record.orderId).set({ ...record, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function getPaymentOrder(orderId: string, token?: string) {
  const memory = orders().get(orderId);
  if (memory) return memory;
  const signed = await recordFromToken(token);
  if (signed?.orderId === orderId) {
    orders().set(orderId, signed);
    return signed;
  }
  const db = await getAdminDb();
  if (!db) return undefined;
  const snap = await db.collection("payment_orders").doc(orderId).get();
  if (!snap.exists) return undefined;
  const record = snap.data() as unknown as PaymentOrderRecord;
  orders().set(orderId, record);
  return record;
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
