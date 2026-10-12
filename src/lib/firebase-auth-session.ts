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

function resetFallbackMessage(err: unknown) {
  const code = err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : "";
  if (code === "auth/too-many-requests") return "Please wait a minute, then try again.";
  return "Could not send the reset email. Set RESEND_API_KEY, NOTIFY_FROM_EMAIL, and FIREBASE_SERVICE_ACCOUNT_JSON on Preview so the link is sent with Resend.";
}

export async function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();
  let fallback = false;
  try {
    const response = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalized }),
    });
    const body = (await response.json().catch(() => ({}))) as { fallback?: boolean; error?: string };
    if (response.status === 429) {
      throw new Error(body.error || "Please wait a minute, then try again.");
    }
    if (response.ok && body.fallback !== true) return;
    fallback = true;
  } catch (err) {
    if (err instanceof Error && /wait a minute/i.test(err.message)) throw err;
    fallback = true;
  }

  if (!fallback) return;
  const instance = getFirebaseAuth();
  if (!instance) {
    throw new Error("Firebase Auth is not configured. Add NEXT_PUBLIC_FIREBASE_* keys.");
  }
  try {
    await sendPasswordResetEmail(instance, normalized);
  } catch (err) {
    throw new Error(resetFallbackMessage(err));
  }
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
