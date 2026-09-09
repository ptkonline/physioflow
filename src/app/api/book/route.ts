import { getAdminDb } from "@/lib/server/firebase-admin";
import { NextRequest } from "next/server";

type BookBody = {
  bookingId?: string;
  consultId?: string;
  physioId?: string;
  patientId?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  doctorEmail?: string;
  scheduledAt?: string;
  durationMin?: number;
  reason?: string;
  notes?: string;
  mode?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  paymentStatus?: string;
  amount?: number;
  currency?: string;
};

function slotDocId(physioId: string, scheduledAt: string) {
  const t = new Date(scheduledAt);
  t.setSeconds(0, 0);
  return `${physioId}_${t.getTime()}`;
}

export async function POST(request: NextRequest) {
  let body: BookBody;
  try {
    body = (await request.json()) as BookBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const physioId = String(body.physioId ?? "").trim();
  const scheduledAt = String(body.scheduledAt ?? "").trim();
  const patientId = String(body.patientId ?? body.patientEmail ?? "").trim();
  if (!physioId || !scheduledAt || !patientId || Number.isNaN(Date.parse(scheduledAt))) {
    return Response.json({ error: "physioId, patientId, and scheduledAt are required" }, { status: 400 });
  }

  const bookingId = String(body.bookingId ?? `book_${crypto.randomUUID().slice(0, 8)}`);
  const consultId = String(body.consultId ?? `call_${crypto.randomUUID().slice(0, 8)}`);
  const slotId = slotDocId(physioId, scheduledAt);

  const adminDb = await getAdminDb();
  if (!adminDb) {
    return Response.json({
      ok: true,
      local: true,
      bookingId,
      consultId,
      hint: "No Admin SDK — client should enforce openSlots locally.",
    });
  }

  try {
    const admin = await import("firebase-admin");
    const db = admin.firestore();
    const FieldValue = admin.firestore.FieldValue;

    await db.runTransaction(async (tx) => {
      const slotRef = db.collection("booking_slots").doc(slotId);
      const slotSnap = await tx.get(slotRef);
      if (slotSnap.exists) {
        const held = slotSnap.data();
        if (held?.bookingId && held.bookingId !== bookingId) {
          throw new Error("SLOT_TAKEN");
        }
      }

      const bookingRef = db.collection("bookings").doc(bookingId);
      tx.set(
        bookingRef,
        {
          id: bookingId,
          consultId,
          patientId,
          physioId,
          createdById: patientId,
          patientName: String(body.patientName ?? ""),
          patientEmail: String(body.patientEmail ?? "").trim().toLowerCase(),
          patientPhone: String(body.patientPhone ?? ""),
          doctorEmail: String(body.doctorEmail ?? "").trim().toLowerCase(),
          scheduledAt,
          durationMin: Math.max(15, Number(body.durationMin ?? 30) || 30),
          reason: String(body.reason ?? "Consultation").slice(0, 200),
          notes: String(body.notes ?? "").slice(0, 1000),
          status: "upcoming",
          mode: body.mode === "offline" ? "offline" : "online",
          paymentId: body.paymentId,
          razorpayOrderId: body.razorpayOrderId,
          paymentStatus: body.paymentStatus ?? "pending",
          amount: body.amount,
          currency: body.currency ?? "INR",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      tx.set(
        slotRef,
        {
          physioId,
          scheduledAt,
          bookingId,
          patientId,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    return Response.json({ ok: true, bookingId, consultId });
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return Response.json({ error: "Slot no longer available" }, { status: 409 });
    }
    console.warn("[book]", err instanceof Error ? err.message : err);
    return Response.json({ error: "Could not reserve slot" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let body: { bookingId?: string; physioId?: string; scheduledAt?: string; previousScheduledAt?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const bookingId = String(body.bookingId ?? "").trim();
  const physioId = String(body.physioId ?? "").trim();
  const scheduledAt = String(body.scheduledAt ?? "").trim();
  if (!bookingId || !physioId || !scheduledAt || Number.isNaN(Date.parse(scheduledAt))) {
    return Response.json({ error: "bookingId, physioId, and scheduledAt are required" }, { status: 400 });
  }

  const adminDb = await getAdminDb();
  if (!adminDb) {
    return Response.json({ ok: true, local: true, bookingId, scheduledAt });
  }

  try {
    const admin = await import("firebase-admin");
    const db = admin.firestore();
    const FieldValue = admin.firestore.FieldValue;
    const newSlotId = slotDocId(physioId, scheduledAt);
    const prevAt = String(body.previousScheduledAt ?? "").trim();
    const oldSlotId = prevAt ? slotDocId(physioId, prevAt) : "";

    await db.runTransaction(async (tx) => {
      const newSlotRef = db.collection("booking_slots").doc(newSlotId);
      const newSnap = await tx.get(newSlotRef);
      if (newSnap.exists) {
        const held = newSnap.data();
        if (held?.bookingId && held.bookingId !== bookingId) {
          throw new Error("SLOT_TAKEN");
        }
      }
      const bookingRef = db.collection("bookings").doc(bookingId);
      tx.set(
        bookingRef,
        { scheduledAt, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
      tx.set(
        newSlotRef,
        { physioId, scheduledAt, bookingId, createdAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
      if (oldSlotId && oldSlotId !== newSlotId) {
        tx.delete(db.collection("booking_slots").doc(oldSlotId));
      }
    });

    return Response.json({ ok: true, bookingId, scheduledAt });
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return Response.json({ error: "Slot no longer available" }, { status: 409 });
    }
    console.warn("[book/reschedule]", err instanceof Error ? err.message : err);
    return Response.json({ error: "Could not reschedule" }, { status: 500 });
  }
}
