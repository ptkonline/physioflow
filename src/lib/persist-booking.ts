import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import type { Booking } from "./types";
import { isFirebaseConfigured } from "./firebase-config";
import { getFirebase } from "./firebase";

export async function persistPaidBooking(booking: Booking, extras?: { patientEmail?: string; doctorEmail?: string }) {
  if (!isFirebaseConfigured()) return;
  const { db } = getFirebase();
  await setDoc(
    doc(db, "bookings", booking.id),
    {
      ...booking,
    patientEmail: (extras?.patientEmail ?? "").trim().toLowerCase(),
    doctorEmail: (extras?.doctorEmail ?? "").trim().toLowerCase(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function persistPaymentRecord(input: {
  orderId: string;
  paymentId: string;
  paymentStatus: string;
  amount: number;
  currency: string;
  patientId: string;
  doctorId: string;
  patientEmail: string;
  bookingId?: string;
}) {
  if (!isFirebaseConfigured()) return;
  const { db } = getFirebase();
  await setDoc(
    doc(db, "payments", input.orderId),
    {
      ...input,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function loadRemoteBookings(email: string): Promise<Booking[]> {
  if (!isFirebaseConfigured() || !email) return [];
  const { db } = getFirebase();
  const normalized = email.trim().toLowerCase();
  const [asPatient, asDoctor] = await Promise.all([
    getDocs(query(collection(db, "bookings"), where("patientEmail", "==", normalized))),
    getDocs(query(collection(db, "bookings"), where("doctorEmail", "==", normalized))),
  ]);
  const map = new Map<string, Booking>();
  for (const snap of [...asPatient.docs, ...asDoctor.docs]) {
    const data = snap.data() as Booking;
    map.set(snap.id, { ...data, id: snap.id });
  }
  return [...map.values()];
}
