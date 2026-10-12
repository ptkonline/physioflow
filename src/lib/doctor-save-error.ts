type FirebaseLike = {
  code?: string;
  status?: number;
  message?: string;
  serverResponse?: string;
};

function asFirebase(err: unknown): FirebaseLike {
  if (!err || typeof err !== "object") return {};
  return err as FirebaseLike;
}

export function explainDoctorSaveError(
  err: unknown,
  env: { bucket?: string; projectId?: string } = {},
): string {
  const fb = asFirebase(err);
  const code = String(fb.code || "");
  const status = Number(fb.status || 0);
  const message = err instanceof Error ? err.message : String(fb.message || err || "");
  const server = String(fb.serverResponse || "");
  const bucket = env.bucket || "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET";
  const projectId = env.projectId || "physioflow-uat";
  const blob = `${code} ${status} ${message} ${server}`;

  if (status === 404 || /object-not-found|\b404\b|Not Found/i.test(blob)) {
    return `Documents were not uploaded. Firebase Storage bucket "${bucket}" was not found (HTTP 404). In the Firebase console for ${projectId}, open Storage and create that bucket, then deploy firebase/storage.rules. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is already set on this preview.`;
  }

  if (/permission-denied|insufficient permissions/i.test(blob)) {
    return `Firestore rejected the profile write (permission-denied). Deploy firebase/firestore.rules to ${projectId} so a signed-in doctor can create users/{uid} and doctors_public/{uid}.`;
  }

  if (/timed out/i.test(message)) return message;

  if (/unauth/i.test(blob)) {
    return "Firebase Auth rejected the session before the profile could be saved. Sign in again, then retry.";
  }

  return message || "Could not save the doctor profile.";
}
