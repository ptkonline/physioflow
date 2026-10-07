import { doc, getDoc, setDoc } from "firebase/firestore";
import type { DoctorPricing, PhysioService } from "./care-types";
import { persistDoctorPublic } from "./doctor-public";
import { isFirebaseConfigured } from "./firebase-config";
import { getFirebase } from "./firebase";
import { normalizeServices } from "./services";
import type { DoctorProfile, PatientProfile, User } from "./types";
import { DEFAULT_HOURS } from "./types";
import { ensureUserUhid, isUhid } from "./uhid";
import { withTimeout } from "./with-timeout";

export async function saveAccountBundle(
  user: User,
  extra?: { profile?: PatientProfile; doctor?: DoctorProfile },
) {
  if (!isFirebaseConfigured()) return;
  const { db } = getFirebase();
  await withTimeout(
    setDoc(
      doc(db, "users", user.id),
      {
        email: user.email.trim().toLowerCase(),
        name: user.name,
        role: user.role,
        phone: user.phone ?? "",
        condition: extra?.profile?.condition ?? null,
        goal: extra?.profile?.goal ?? null,
        ...(isUhid(user.uhid) ? { uhid: user.uhid } : {}),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    ),
    15_000,
    "Saving your profile",
  );
  const uhid = await withTimeout(ensureUserUhid(user.id), 15_000, "Assigning hospital ID");
  if (extra?.doctor) {
    await withTimeout(
      persistDoctorPublic({ ...extra.doctor, uhid: uhid ?? extra.doctor.uhid }, user.email),
      15_000,
      "Saving your public profile",
    );
  }
  return uhid ?? undefined;
}

export async function loadAccountBundle(uid: string): Promise<{
  user: User;
  profile?: PatientProfile;
  doctor?: DoctorProfile;
} | null> {
  if (!isFirebaseConfigured() || !uid) return null;
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  const role = data.role === "physio" ? "physio" : "patient";
  const email = String(data.email ?? "").trim().toLowerCase();
  if (!email) return null;
  let uhid = isUhid(data.uhid) ? data.uhid : "";
  try {
    uhid = (await ensureUserUhid(uid)) || uhid;
  } catch {
    /* Login still opens if the counter write is denied. Signup surfaces that error itself. */
  }
  const user: User = {
    id: uid,
    name: String(data.name || "PhysioFlow user"),
    email,
    role,
    phone: String(data.phone || ""),
    consentHipaa: true,
    consentGdpr: true,
    createdAt: new Date().toISOString(),
    password: "",
    passwordHash: "",
    uhid: uhid || undefined,
  };
  if (role === "patient") {
    const condition = data.condition;
    const profile: PatientProfile = {
      userId: uid,
      condition: condition === "knee" || condition === "back" || condition === "shoulder" || condition === "hip" || condition === "neck" || condition === "ankle" ? condition : "back",
      goal: String(data.goal || "Feel better day to day"),
      diagnosis: "",
      painBaseline: 4,
      dateOfBirth: "",
      assignedPhysioId: "",
      phone: user.phone,
    };
    return { user, profile };
  }
  const pub = await getDoc(doc(db, "doctors_public", uid));
  const row = pub.data() ?? {};
  const pricing = row.pricing as DoctorPricing | undefined;
  const services = normalizeServices(row.services) as PhysioService[];
  const doctor: DoctorProfile = {
    userId: uid,
    clinicId: String(row.clinicId || "DOC"),
    specialty: String(row.specialty || "General physiotherapy"),
    phone: String(row.phone || user.phone || ""),
    bio: String(row.bio || ""),
    photoUrl: typeof row.photoUrl === "string" ? row.photoUrl : undefined,
    isVerified: Boolean(row.isVerified),
    availability: DEFAULT_HOURS,
    consultationFee: typeof row.consultationFee === "number" ? row.consultationFee : pricing?.onlineFee,
    pricing: pricing && typeof pricing.onlineFee === "number" ? pricing : undefined,
    clinicLocation:
      row.clinicLocation && typeof row.clinicLocation === "object"
        ? (row.clinicLocation as DoctorProfile["clinicLocation"])
        : undefined,
    services,
    uhid: uhid || undefined,
  };
  return { user, doctor };
}
