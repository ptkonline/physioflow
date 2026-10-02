import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { isFirebaseConfigured } from "./firebase-config";
import { getFirebase } from "./firebase";
import { withTimeout } from "./with-timeout";

let auth: Auth | undefined;

export function getFirebaseAuth() {
  if (!isFirebaseConfigured()) return null;
  if (!auth) auth = getAuth(getFirebase().app);
  return auth;
}

export async function syncFirebaseAuth(
  email: string,
  password: string,
  options: { createIfMissing?: boolean } = { createIfMissing: true },
): Promise<User | null> {
  const instance = getFirebaseAuth();
  if (!instance) return null;
  const normalized = email.trim().toLowerCase();
  if (instance.currentUser?.email?.toLowerCase() === normalized) {
    return instance.currentUser;
  }
  if (instance.currentUser) {
    await signOut(instance);
  }
  try {
    return (await withTimeout(signInWithEmailAndPassword(instance, normalized, password), 20_000, "Signing in")).user;
  } catch (err) {
    if (err instanceof Error && /timed out/i.test(err.message)) throw err;
    if (!options.createIfMissing) return null;
    try {
      const created = await withTimeout(
        createUserWithEmailAndPassword(instance, normalized, password),
        20_000,
        "Creating your account",
      );
      // Verification email must not block signup. A stalled send leaves the button on "Please wait…".
      await Promise.race([
        sendEmailVerification(created.user).catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 5_000)),
      ]);
      return created.user;
    } catch (createErr) {
      if (createErr instanceof Error && /timed out/i.test(createErr.message)) throw createErr;
      return null;
    }
  }
}

export async function requestPasswordReset(email: string) {
  const instance = getFirebaseAuth();
  if (!instance) {
    throw new Error("Firebase Auth is not configured. Add NEXT_PUBLIC_FIREBASE_* keys.");
  }
  await sendPasswordResetEmail(instance, email.trim().toLowerCase());
}

export async function clearFirebaseAuth() {
  const instance = getFirebaseAuth();
  if (!instance?.currentUser) return;
  await signOut(instance);
}

/** Sign into Firebase Auth so Firestore rules (email match) can succeed. */
export async function ensureFirebaseSession(email?: string) {
  const instance = getFirebaseAuth();
  if (!instance) return null;
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return instance.currentUser;
  if (instance.currentUser?.email?.toLowerCase() === normalized) {
    return instance.currentUser;
  }
  return instance.currentUser;
}
