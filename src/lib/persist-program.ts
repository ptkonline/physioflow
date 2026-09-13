import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { Program } from "./types";
import { isFirebaseConfigured } from "./firebase-config";
import { getFirebase } from "./firebase";

export async function persistProgram(program: Program) {
  if (!isFirebaseConfigured()) return;
  const { db } = getFirebase();
  await setDoc(
    doc(db, "programs", program.id),
    { ...program, updatedAt: serverTimestamp() },
    { merge: true },
  );
  await setDoc(
    doc(db, "patient_programs", `${program.patientId}_${program.id}`),
    {
      programId: program.id,
      patientId: program.patientId,
      physioId: program.physioId,
      status: program.status,
      startDate: program.startDate,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
