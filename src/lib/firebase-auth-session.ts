import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { isFirebaseConfigured, emulatorEnabled } from "./firebase-config";
import { getFirebase } from "./firebase";

let auth: Auth | undefined;

export function getFirebaseAuth() {
  if (!isFirebaseConfigured()) return null;
  if (!auth) {
    auth = getAuth(getFirebase().app);
    if (emulatorEnabled()) {
      const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST?.trim() || "127.0.0.1";
      const port = Number.parseInt(process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT ?? "", 10) || 9099;
      try {
        connectAuthEmulator(auth, `http://${host}:${port}`, { disableWarnings: true });
      } catch {
        /* already connected (HMR) */
      }
    }
  }
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
    return (await signInWithEmailAndPassword(instance, normalized, password)).user;
  } catch {
    if (!options.createIfMissing) return null;
    try {
      const created = await createUserWithEmailAndPassword(instance, normalized, password);
      await sendEmailVerification(created.user).catch(() => undefined);
      return created.user;
    } catch {
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
