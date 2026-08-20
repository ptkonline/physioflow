import type { PaymentOrderRecord } from "@/lib/pricing";

const g = globalThis as typeof globalThis & { __pfPaymentOrders?: Map<string, PaymentOrderRecord> };

function orders() {
  if (!g.__pfPaymentOrders) g.__pfPaymentOrders = new Map();
  return g.__pfPaymentOrders;
}

export function savePaymentOrder(record: PaymentOrderRecord) {
  orders().set(record.orderId, record);
}

export function getPaymentOrder(orderId: string) {
  return orders().get(orderId);
}

export function markOrderPaid(orderId: string, paymentId: string, paymentMethod?: string) {
  const current = orders().get(orderId);
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
  orders().set(orderId, next);
  return next;
}

export function markOrderFailed(orderId: string) {
  const current = orders().get(orderId);
  if (!current || current.paymentStatus === "success") return current;
  const next: PaymentOrderRecord = { ...current, paymentStatus: "failed" };
  orders().set(orderId, next);
  return next;
}
