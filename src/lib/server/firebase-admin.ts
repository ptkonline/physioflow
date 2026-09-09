type AdminDb = {
  collection: (name: string) => {
    doc: (id?: string) => {
      get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
      set: (data: Record<string, unknown>, options?: { merge?: boolean }) => Promise<void>;
    };
    where: (field: string, op: "==", value: unknown) => {
      get: () => Promise<{ docs: Array<{ id: string; data: () => Record<string, unknown>; ref: { update: (d: Record<string, unknown>) => Promise<void> } }> }>;
    };
    add: (data: Record<string, unknown>) => Promise<void>;
  };
};

let cached: AdminDb | null | undefined;

export async function getAdminDb(): Promise<AdminDb | null> {
  if (cached !== undefined) return cached;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!raw || !projectId) {
    cached = null;
    return null;
  }
  try {
    const admin = await import("firebase-admin");
    const cred = JSON.parse(raw) as { client_email?: string; private_key?: string; project_id?: string };
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: cred.project_id || projectId,
          clientEmail: cred.client_email,
          privateKey: cred.private_key?.replace(/\\n/g, "\n"),
        }),
      });
    }
    cached = admin.firestore() as unknown as AdminDb;
    return cached;
  } catch (err) {
    console.warn("[firebase-admin]", err instanceof Error ? err.message : err);
    cached = null;
    return null;
  }
}
