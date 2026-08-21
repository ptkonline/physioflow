import { doc, setDoc } from "firebase/firestore";
import type { DoctorProfile } from "./types";
import { isFirebaseConfigured } from "./firebase-config";
import { getFirebase } from "./firebase";

export async function persistDoctorPublic(doctor: DoctorProfile, email: string) {
  if (!isFirebaseConfigured()) return;
  const { db } = getFirebase();
  await setDoc(
    doc(db, "doctors_public", doctor.userId),
    {
      email: email.trim().toLowerCase(),
      clinicId: doctor.clinicId,
      specialty: doctor.specialty,
      phone: doctor.phone,
      bio: doctor.bio,
      photoUrl: doctor.photoUrl ?? null,
      isVerified: Boolean(doctor.isVerified),
      clinicLocation: doctor.clinicLocation ?? null,
      pricing: doctor.pricing ?? null,
      consultationFee: doctor.consultationFee ?? doctor.pricing?.onlineFee ?? null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}
