const PUBLIC_FIREBASE_ENV = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

export function missingFirebasePublicEnv() {
  return PUBLIC_FIREBASE_ENV.filter((key) => !process.env[key]);
}

export function isFirebaseConfigured() {
  return missingFirebasePublicEnv().length === 0;
}
