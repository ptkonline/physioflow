import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import type { LibraryVideo } from "./care-types";
import { isFirebaseConfigured } from "./firebase-config";
import { getFirebase } from "./firebase";
import { compressImage } from "./image";
import { seedVideos } from "./seed";
import { idbDeleteBlob, idbPutBlob } from "./video-idb";

const LOCAL_KEY = "physioflow.videos";
const HIDDEN_KEY = "physioflow.videos.hidden";
const bus = typeof window === "undefined" ? null : new EventTarget();

function hiddenIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]") as string[]);
  } catch {
    return new Set();
  }
}

function hideLocal(id: string) {
  const next = [...hiddenIds(), id];
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
}

function localVideos(): LibraryVideo[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as LibraryVideo[];
  } catch {
    return [];
  }
}

function saveLocal(rows: LibraryVideo[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows));
  bus?.dispatchEvent(new Event("videos"));
}

function withSeed(rows: LibraryVideo[]) {
  const hidden = hiddenIds();
  const map = new Map(seedVideos.filter((v) => !hidden.has(v.id)).map((v) => [v.id, v]));
  for (const row of rows) {
    if (!hidden.has(row.id)) map.set(row.id, row);
  }
  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mapDoc(id: string, data: Record<string, unknown>): LibraryVideo {
  const created = data.createdAt as { toDate?: () => Date } | string | undefined;
  const createdAt =
    typeof created === "string"
      ? created
      : created?.toDate?.().toISOString() ?? new Date().toISOString();
  return {
    id,
    doctorId: String(data.doctorId ?? ""),
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    category: String(data.category ?? ""),
    videoUrl: String(data.videoUrl ?? ""),
    thumbnailUrl: String(data.thumbnailUrl ?? ""),
    duration: Number(data.duration ?? 0),
    createdAt,
    isPublic: Boolean(data.isPublic),
    storagePath: data.storagePath ? String(data.storagePath) : undefined,
    thumbPath: data.thumbPath ? String(data.thumbPath) : undefined,
  };
}

async function uploadResumable(
  path: string,
  blob: Blob,
  contentType: string,
  onProgress?: (pct: number) => void,
) {
  const { storage } = getFirebase();
  const fileRef = ref(storage, path);
  const task = uploadBytesResumable(fileRef, blob, { contentType });
  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      () => resolve(),
    );
  });
  return getDownloadURL(fileRef);
}

export type VideoUploadInput = {
  doctorId: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  isPublic: boolean;
  video: File;
  thumbnail?: File | Blob;
  onProgress?: (pct: number) => void;
};

export async function uploadLibraryVideo(input: VideoUploadInput): Promise<LibraryVideo> {
  const id = `vid-${crypto.randomUUID()}`;
  const thumbBlob =
    input.thumbnail instanceof File
      ? await compressImage(input.thumbnail, 720, 0.72)
      : input.thumbnail ?? new Blob();

  if (!isFirebaseConfigured()) {
    input.onProgress?.(20);
    await idbPutBlob(`${id}-video`, input.video);
    input.onProgress?.(70);
    if (thumbBlob.size) await idbPutBlob(`${id}-thumb`, thumbBlob);
    input.onProgress?.(100);
    const row: LibraryVideo = {
      id,
      doctorId: input.doctorId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      videoUrl: `idb:${id}-video`,
      thumbnailUrl: thumbBlob.size ? `idb:${id}-thumb` : "",
      duration: input.duration,
      createdAt: new Date().toISOString(),
      isPublic: input.isPublic,
    };
    saveLocal([row, ...localVideos()]);
    return row;
  }

  const storagePath = `videos/${input.doctorId}/${id}/source`;
  const thumbPath = `videos/${input.doctorId}/${id}/thumb`;
  const videoUrl = await uploadResumable(storagePath, input.video, input.video.type || "video/mp4", (pct) =>
    input.onProgress?.(Math.round(pct * 0.9)),
  );
  let thumbnailUrl = "";
  if (thumbBlob.size) {
    thumbnailUrl = await uploadResumable(thumbPath, thumbBlob, "image/jpeg");
  }
  input.onProgress?.(100);
  const { db } = getFirebase();
  const refDoc = await addDoc(collection(db, "videos"), {
    doctorId: input.doctorId,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    videoUrl,
    thumbnailUrl,
    duration: input.duration,
    isPublic: input.isPublic,
    storagePath,
    thumbPath,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return {
    id: refDoc.id,
    doctorId: input.doctorId,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    videoUrl,
    thumbnailUrl,
    duration: input.duration,
    createdAt: new Date().toISOString(),
    isPublic: input.isPublic,
    storagePath,
    thumbPath,
  };
}

export async function updateLibraryVideo(
  video: LibraryVideo,
  patch: Partial<Pick<LibraryVideo, "title" | "description" | "category" | "isPublic" | "duration">>,
) {
  const next = { ...video, ...patch, title: (patch.title ?? video.title).trim() };
  if (!isFirebaseConfigured()) {
    saveLocal([next, ...localVideos().filter((row) => row.id !== video.id)]);
    return next;
  }
  const { db } = getFirebase();
  await updateDoc(doc(db, "videos", video.id), {
    title: next.title,
    description: next.description,
    category: next.category,
    isPublic: next.isPublic,
    duration: next.duration,
    updatedAt: serverTimestamp(),
  });
  return next;
}

export async function deleteLibraryVideo(video: LibraryVideo) {
  if (!isFirebaseConfigured()) {
    await idbDeleteBlob(`${video.id}-video`);
    await idbDeleteBlob(`${video.id}-thumb`);
    hideLocal(video.id);
    saveLocal(localVideos().filter((row) => row.id !== video.id));
    return;
  }
  const { db, storage } = getFirebase();
  if (video.storagePath) await deleteObject(ref(storage, video.storagePath)).catch(() => undefined);
  if (video.thumbPath) await deleteObject(ref(storage, video.thumbPath)).catch(() => undefined);
  await deleteDoc(doc(db, "videos", video.id));
}

export function subscribeDoctorVideos(doctorId: string, onChange: (rows: LibraryVideo[]) => void): () => void {
  if (!isFirebaseConfigured()) {
    const emit = () => onChange(withSeed(localVideos()).filter((v) => v.doctorId === doctorId));
    emit();
    const handler = () => emit();
    bus?.addEventListener("videos", handler);
    window.addEventListener("storage", handler);
    return () => {
      bus?.removeEventListener("videos", handler);
      window.removeEventListener("storage", handler);
    };
  }
  const { db } = getFirebase();
  const q = query(collection(db, "videos"), where("doctorId", "==", doctorId));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => mapDoc(d.id, d.data())));
  });
}

export function subscribePatientVideos(
  assignedDoctorId: string,
  extraDoctorIds: string[],
  onChange: (rows: LibraryVideo[]) => void,
): () => void {
  const allowed = new Set([assignedDoctorId, ...extraDoctorIds].filter(Boolean));
  if (!isFirebaseConfigured()) {
    const emit = () =>
      onChange(withSeed(localVideos()).filter((v) => v.isPublic || allowed.has(v.doctorId)));
    emit();
    const handler = () => emit();
    bus?.addEventListener("videos", handler);
    window.addEventListener("storage", handler);
    return () => {
      bus?.removeEventListener("videos", handler);
      window.removeEventListener("storage", handler);
    };
  }
  const { db } = getFirebase();
  const publicQ = query(collection(db, "videos"), where("isPublic", "==", true));
  const unsubs: Array<() => void> = [];
  const bucket = new Map<string, LibraryVideo>();
  const emit = () => onChange([...bucket.values()]);
  unsubs.push(
    onSnapshot(publicQ, (snap) => {
      for (const d of snap.docs) bucket.set(d.id, mapDoc(d.id, d.data()));
      emit();
    }),
  );
  for (const doctorId of allowed) {
    const q = query(collection(db, "videos"), where("doctorId", "==", doctorId));
    unsubs.push(
      onSnapshot(q, (snap) => {
        for (const d of snap.docs) bucket.set(d.id, mapDoc(d.id, d.data()));
        emit();
      }),
    );
  }
  return () => unsubs.forEach((fn) => fn());
}
