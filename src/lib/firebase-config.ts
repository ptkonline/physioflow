/** Demo project id used when running against the local Firebase Emulator Suite. */
export const EMULATOR_PROJECT_ID = "demo-physioflow";

/**
 * When `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true` the app talks to the local
 * Firebase Emulator Suite (Auth + Firestore + Storage) instead of a real
 * project. This makes cross-user chat and video signaling work in local
 * development without provisioning cloud credentials.
 */
export function emulatorEnabled() {
  return process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true";
}

export function isFirebaseConfigured() {
  if (emulatorEnabled()) return true;
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
}
