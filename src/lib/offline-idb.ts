const DB = "physioflow-offline";
const STORE = "queue";

export type OfflineChatPayload = {
  appointmentId: string;
  senderId: string;
  text: string;
  patientId: string;
  doctorId: string;
  patientEmail: string;
  doctorEmail: string;
};

export type OfflineExercisePayload = {
  patientId: string;
  exerciseId: string;
  programId: string;
  painAfter: number;
  rating: number;
  comment: string;
};

export type OfflineLogPayload = {
  patientId: string;
  appointmentId: string;
  doctorId: string;
  date: string;
  didExercises: boolean;
  painLevel: number;
  note: string;
};

export type OfflineItem =
  | { id: string; kind: "chat"; payload: OfflineChatPayload; createdAt: string }
  | { id: string; kind: "exercise"; payload: OfflineExercisePayload; createdAt: string }
  | { id: string; kind: "log"; payload: OfflineLogPayload; createdAt: string };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueOffline(item: OfflineItem) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function readOfflineQueue(): Promise<OfflineItem[]> {
  const db = await openDb();
  const rows = await new Promise<OfflineItem[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as OfflineItem[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows;
}

export async function deleteOfflineItem(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
