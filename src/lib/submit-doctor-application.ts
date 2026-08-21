import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { DoctorRegisterValues } from "./doctor-register-schema";
import { isFirebaseConfigured } from "./firebase-config";
import { getFirebase } from "./firebase";
import { compressImage, fileToDataUrl } from "./image";

const LOCAL_KEY = "physioflow.doctors_pending_verification";

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fileMeta(file: File) {
  return { name: file.name, type: file.type, size: file.size };
}

async function notifyAdmin(payload: {
  applicationId: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  registrationNumber: string;
}) {
  const notify = await fetch("/api/notify-admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!notify.ok) {
    const body = (await notify.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Application saved, but the admin email could not be sent.");
  }
}

async function submitLocal(values: DoctorRegisterValues) {
  const id = `local-${crypto.randomUUID()}`;
  const photo = await compressImage(values.profilePhoto);
  const record = {
    id,
    name: values.name,
    email: values.email.toLowerCase(),
    phone: values.phone,
    passwordHash: await sha256(values.password),
    degree: values.degree,
    specialization: values.specialization,
    registrationNumber: values.registrationNumber,
    experienceYears: values.experienceYears,
    clinicName: values.clinicName,
    address: values.address,
    clinicLocation: {
      latitude: values.latitude,
      longitude: values.longitude,
      address: values.address,
    },
    pricing: {
      onlineFee: values.onlineFee,
      offlineFee: values.offlineFee,
      currency: "INR",
    },
    fees: values.onlineFee,
    availability: {
      days: values.availabilityDays,
      startHour: values.startHour,
      endHour: values.endHour,
    },
    photo: fileMeta(photo),
    photoDataUrl: await fileToDataUrl(photo),
    documents: {
      degreeCert: fileMeta(values.degreeCert),
      idProof: fileMeta(values.idProof),
      registrationCard: fileMeta(values.registrationCard),
    },
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };
  const existing = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as unknown[];
  localStorage.setItem(LOCAL_KEY, JSON.stringify([record, ...existing]));
  await notifyAdmin({
    applicationId: id,
    name: values.name,
    email: values.email,
    phone: values.phone,
    specialization: values.specialization,
    registrationNumber: values.registrationNumber,
  });
  return id;
}

async function uploadDoc(storage: ReturnType<typeof getFirebase>["storage"], folder: string, name: string, file: File) {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const fileRef = ref(storage, `${folder}/${name}-${Date.now()}-${safe}`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}

export async function submitDoctorApplication(values: DoctorRegisterValues) {
  if (!isFirebaseConfigured()) {
    return submitLocal(values);
  }

  const { db, storage } = getFirebase();
  const folder = `doctors_pending_verification/${crypto.randomUUID()}`;
  const photo = await compressImage(values.profilePhoto);
  const [profilePhotoUrl, degreeCertUrl, idProofUrl, registrationCardUrl] = await Promise.all([
    uploadDoc(storage, folder, "profile-photo", photo),
    uploadDoc(storage, folder, "degree-cert", values.degreeCert),
    uploadDoc(storage, folder, "id-proof", values.idProof),
    uploadDoc(storage, folder, "registration-card", values.registrationCard),
  ]);

  const docRef = await addDoc(collection(db, "doctors_pending_verification"), {
    name: values.name,
    email: values.email.toLowerCase(),
    phone: values.phone,
    passwordHash: await sha256(values.password),
    degree: values.degree,
    specialization: values.specialization,
    registrationNumber: values.registrationNumber,
    experienceYears: values.experienceYears,
    clinicName: values.clinicName,
    address: values.address,
    clinicLocation: {
      latitude: values.latitude,
      longitude: values.longitude,
      address: values.address,
    },
    pricing: {
      onlineFee: values.onlineFee,
      offlineFee: values.offlineFee,
      currency: "INR",
    },
    fees: values.onlineFee,
    availability: {
      days: values.availabilityDays,
      startHour: values.startHour,
      endHour: values.endHour,
    },
    profilePhotoUrl,
    documents: {
      degreeCertUrl,
      idProofUrl,
      registrationCardUrl,
    },
    status: "pending",
    createdAt: serverTimestamp(),
  });

  await notifyAdmin({
    applicationId: docRef.id,
    name: values.name,
    email: values.email,
    phone: values.phone,
    specialization: values.specialization,
    registrationNumber: values.registrationNumber,
  });

  return docRef.id;
}
