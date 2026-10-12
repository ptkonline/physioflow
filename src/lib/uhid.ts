import { doc, runTransaction } from "firebase/firestore";
import { isFirebaseConfigured } from "./firebase-config";
import { getFirebase } from "./firebase";

const UHID_RE = /^PF-\d{8}$/;

export function formatUhid(sequence: number) {
  return `PF-${String(sequence).padStart(8, "0")}`;
}

export function isUhid(value: unknown): value is string {
  return typeof value === "string" && UHID_RE.test(value);
}

/**
 * Assign a permanent hospital ID on `users/{uid}.uhid`.
 * The number comes from a transaction on `counters/uhid` and is claimed in `uhids/{uhid}`
 * so two signups cannot receive the same value. An existing uhid is returned unchanged.
 * When `doctors_public/{uid}` exists and has no uhid, the same value is copied there.
 */
export async function ensureUserUhid(uid: string): Promise<string | null> {
  if (!isFirebaseConfigured() || !uid) return null;
  const { db } = getFirebase();
  return runTransaction(db, async (tx) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await tx.get(userRef);
    const current = userSnap.exists() ? userSnap.data()?.uhid : "";
    const pubRef = doc(db, "doctors_public", uid);
    const pubSnap = await tx.get(pubRef);

    let uhid = isUhid(current) ? current : "";
    if (!uhid) {
      const counterRef = doc(db, "counters", "uhid");
      const counterSnap = await tx.get(counterRef);
      const prev = counterSnap.exists() ? Number(counterSnap.data()?.next) || 0 : 0;
      const next = prev + 1;
      if (next > 99_999_999) throw new Error("UHID sequence is exhausted.");
      uhid = formatUhid(next);
      const claimRef = doc(db, "uhids", uhid);
      const claimSnap = await tx.get(claimRef);
      if (claimSnap.exists()) throw new Error("UHID was already claimed. Try again.");
      tx.set(counterRef, { next });
      tx.set(claimRef, { uid, createdAt: new Date().toISOString() });
      tx.set(userRef, { uhid }, { merge: true });
    }

    if (pubSnap.exists() && !isUhid(pubSnap.data()?.uhid)) {
      tx.set(pubRef, { uhid }, { merge: true });
    }
    return uhid;
  });
}
