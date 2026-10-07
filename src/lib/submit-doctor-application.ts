import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import type { DoctorRegisterValues } from "./doctor-register-schema";
import { explainDoctorSaveError } from "./doctor-save-error";
import { isFirebaseConfigured } from "./firebase-config";
import { getFirebase } from "./firebase";
import { compressImage, fileToDataUrl } from "./image";
import { hashPassword } from "./password";
import { withTimeout } from "./with-timeout";

const LOCAL_KEY = "physioflow.doctors_pending_verification";

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
    passwordHash: await hashPassword(values.password),
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

function contentTypeFor(file: File) {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".heic")) return "image/heic";
  return "image/jpeg";
}

async function prepareFile(file: File) {
  try {
    return await withTimeout(compressImage(file), 8_000, "Preparing a document");
  } catch {
    return file;
  }
}

function uploadDoc(storage: ReturnType<typeof getFirebase>["storage"], folder: string, name: string, file: File) {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const fileRef = ref(storage, `${folder}/${name}-${Date.now()}-${safe}`);
  const task = uploadBytesResumable(fileRef, file, { contentType: contentTypeFor(file) });
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      task.cancel();
      reject(new Error("Document upload timed out after 12s. Check your connection and try again."));
    }, 12_000);
    task.on(
      "state_changed",
      () => undefined,
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
      () => {
        clearTimeout(timer);
        getDownloadURL(fileRef).then(resolve, reject);
      },
    );
  });
}

async function inlineDocuments(photo: File, values: DoctorRegisterValues) {
  const [profilePhotoDataUrl, degreeCertDataUrl, idProofDataUrl, registrationCardDataUrl] = await withTimeout(
    Promise.all([
      fileToDataUrl(photo),
      fileToDataUrl(values.degreeCert),
      fileToDataUrl(values.idProof),
      fileToDataUrl(values.registrationCard),
    ]),
    10_000,
    "Reading documents",
  );
  const inline = { profilePhotoDataUrl, degreeCertDataUrl, idProofDataUrl, registrationCardDataUrl };
  if (JSON.stringify(inline).length > 900_000) return null;
  return inline;
}

export async function submitDoctorApplication(values: DoctorRegisterValues) {
  if (!isFirebaseConfigured()) {
    return submitLocal(values);
  }

  const { db, storage } = getFirebase();
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const folder = `doctors_pending_verification/${crypto.randomUUID()}`;
  const [photo, degreeCert, idProof, registrationCard] = await Promise.all([
    prepareFile(values.profilePhoto),
    prepareFile(values.degreeCert),
    prepareFile(values.idProof),
    prepareFile(values.registrationCard),
  ]);

  let profilePhotoUrl = "";
  let degreeCertUrl = "";
  let idProofUrl = "";
  let registrationCardUrl = "";
  let storageError: unknown = null;
  try {
    [profilePhotoUrl, degreeCertUrl, idProofUrl, registrationCardUrl] = await Promise.all([
      uploadDoc(storage, folder, "profile-photo", photo),
      uploadDoc(storage, folder, "degree-cert", degreeCert),
      uploadDoc(storage, folder, "id-proof", idProof),
      uploadDoc(storage, folder, "registration-card", registrationCard),
    ]);
  } catch (err) {
    storageError = err;
  }

  const inline = storageError
    ? await inlineDocuments(photo, {
        ...values,
        profilePhoto: photo,
        degreeCert,
        idProof,
        registrationCard,
      }).catch(() => null)
    : null;

  if (storageError && !inline) {
    throw new Error(explainDoctorSaveError(storageError, { bucket, projectId }));
  }

  const passwordHash = await withTimeout(hashPassword(values.password), 20_000, "Securing your password");
  let docRef;
  try {
    docRef = await withTimeout(
    addDoc(collection(db, "doctors_pending_verification"), {
      name: values.name,
      email: values.email.toLowerCase(),
      phone: values.phone,
      passwordHash,
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
      profilePhotoUrl: profilePhotoUrl || null,
      documents: {
        degreeCertUrl: degreeCertUrl || null,
        idProofUrl: idProofUrl || null,
        registrationCardUrl: registrationCardUrl || null,
        ...(inline
          ? {
              degreeCertDataUrl: inline.degreeCertDataUrl,
              idProofDataUrl: inline.idProofDataUrl,
              registrationCardDataUrl: inline.registrationCardDataUrl,
            }
          : {}),
      },
      ...(inline ? { profilePhotoDataUrl: inline.profilePhotoDataUrl } : {}),
      storageFallback: Boolean(inline),
      status: "pending",
      createdAt: serverTimestamp(),
    }),
    15_000,
    "Saving your doctor profile",
  );
  } catch (err) {
    throw new Error(explainDoctorSaveError(err, { bucket, projectId }));
  }

  void withTimeout(
    notifyAdmin({
      applicationId: docRef.id,
      name: values.name,
      email: values.email,
      phone: values.phone,
      specialization: values.specialization,
      registrationNumber: values.registrationNumber,
    }),
    8_000,
    "Notifying admin",
  ).catch(() => undefined);

  return docRef.id;
}
