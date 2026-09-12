import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { ChatMessage, ChatRoom, MessageType } from "./care-types";
import { isFirebaseConfigured } from "./firebase-config";
import { getFirebase } from "./firebase";
import { ensureFirebaseSession } from "./firebase-auth-session";
import { compressImage, fileToDataUrl } from "./image";

const LOCAL_CHATS = "physioflow.chats";
const PAGE_SIZE = 40;
const bus = typeof window === "undefined" ? null : new EventTarget();

function localRooms(): Record<string, { room: ChatRoom; messages: ChatMessage[] }> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CHATS) || "{}") as Record<
      string,
      { room: ChatRoom; messages: ChatMessage[] }
    >;
  } catch {
    return {};
  }
}

function saveLocal(data: ReturnType<typeof localRooms>) {
  localStorage.setItem(LOCAL_CHATS, JSON.stringify(data));
  bus?.dispatchEvent(new Event("chats"));
}

export function chatIdFor(appointmentId: string) {
  return appointmentId;
}

async function ensureChatAuth(email?: string) {
  await ensureFirebaseSession(email);
}

function ensureLocalRoom(room: ChatRoom) {
  const all = localRooms();
  if (!all[room.id]) {
    all[room.id] = { room, messages: [] };
    saveLocal(all);
  }
  return all[room.id].room;
}

export async function ensureChatRoom(input: {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  patientEmail?: string;
  doctorEmail?: string;
  localEmail?: string;
}): Promise<ChatRoom> {
  const id = chatIdFor(input.appointmentId);
  const room: ChatRoom = {
    id,
    appointmentId: input.appointmentId,
    patientId: input.patientId,
    doctorId: input.doctorId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  ensureLocalRoom(room);
  if (!isFirebaseConfigured()) return room;
  await ensureChatAuth(input.localEmail || input.patientEmail || input.doctorEmail);
  try {
    const { db } = getFirebase();
    const refDoc = doc(db, "chats", id);
    const existing = await getDoc(refDoc);
    const payload = {
      appointmentId: input.appointmentId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      patientEmail: (input.patientEmail ?? "").trim().toLowerCase(),
      doctorEmail: (input.doctorEmail ?? "").trim().toLowerCase(),
      updatedAt: serverTimestamp(),
    };
    if (!existing.exists()) {
      await setDoc(refDoc, { ...payload, createdAt: serverTimestamp() });
    } else {
      await setDoc(refDoc, payload, { merge: true });
    }
  } catch (err) {
    console.warn("[chat] Firestore room unavailable, using local thread", err);
  }
  return room;
}

export function subscribeMessages(
  appointmentId: string,
  onChange: (messages: ChatMessage[]) => void,
  onError?: (message: string) => void,
): () => void {
  const id = chatIdFor(appointmentId);
  if (!isFirebaseConfigured()) {
    const emit = () => onChange(localRooms()[id]?.messages ?? []);
    emit();
    const handler = () => emit();
    const bc = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(`pf-chat-${id}`);
    bc?.addEventListener("message", handler);
    bus?.addEventListener("chats", handler);
    window.addEventListener("storage", handler);
    return () => {
      bc?.close();
      bus?.removeEventListener("chats", handler);
      window.removeEventListener("storage", handler);
    };
  }
  const { db } = getFirebase();
  const q = query(
    collection(db, "chats", id, "messages"),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE),
  );
  let lastRemote: ChatMessage[] = [];
  const merge = (remote?: ChatMessage[]) => {
    if (remote) lastRemote = remote;
    const local = localRooms()[id]?.messages ?? [];
    const keys = new Set(lastRemote.map((m) => `${m.senderId}|${m.text}|${m.href ?? ""}`));
    const extras = local.filter((m) => !keys.has(`${m.senderId}|${m.text}|${m.href ?? ""}`));
    onChange(
      [...lastRemote, ...extras].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    );
  };
  merge();
  const localHandler = () => merge();
  const bc = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(`pf-chat-${id}`);
  bc?.addEventListener("message", localHandler);
  bus?.addEventListener("chats", localHandler);
  window.addEventListener("storage", localHandler);

  const unsubRemote = onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs
        .map((d) => {
          const data = d.data();
          const created = data.createdAt as Timestamp | string | undefined;
          return {
            id: d.id,
            senderId: String(data.senderId ?? ""),
            text: String(data.text ?? ""),
            imageUrl: data.imageUrl as string | undefined,
            fileUrl: data.fileUrl as string | undefined,
            videoId: data.videoId as string | undefined,
            videoUrl: data.videoUrl as string | undefined,
            videoTitle: data.videoTitle as string | undefined,
            href: data.href as string | undefined,
            type: (data.type as MessageType) ?? "text",
            createdAt: typeof created === "string" ? created : created?.toDate().toISOString() ?? new Date().toISOString(),
          } satisfies ChatMessage;
        })
        .reverse();
      merge(rows);
    },
    () => {
      merge();
    },
  );

  return () => {
    unsubRemote();
    bc?.close();
    bus?.removeEventListener("chats", localHandler);
    window.removeEventListener("storage", localHandler);
  };
}

function persistLocalMessage(id: string, message: ChatMessage) {
  const all = localRooms();
  if (!all[id]) {
    all[id] = {
      room: {
        id,
        appointmentId: id,
        patientId: "",
        doctorId: "",
        createdAt: message.createdAt,
        updatedAt: message.createdAt,
      },
      messages: [],
    };
  }
  all[id].messages.push(message);
  all[id].room.updatedAt = message.createdAt;
  saveLocal(all);
  if (typeof BroadcastChannel !== "undefined") {
    new BroadcastChannel(`pf-chat-${id}`).postMessage({ type: "chats" });
  }
}

async function uploadChatFile(appointmentId: string, file: File, kind: "image" | "file") {
  const ready = kind === "image" ? await compressImage(file, 1280, 0.75) : file;
  if (!isFirebaseConfigured()) return fileToDataUrl(ready);
  try {
    const { storage } = getFirebase();
    const path = `chats/${appointmentId}/${kind}-${Date.now()}-${ready.name.replace(/[^\w.\-]+/g, "_")}`;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, ready, { contentType: ready.type });
    return getDownloadURL(fileRef);
  } catch (err) {
    console.warn("[chat] Storage upload failed, using inline file", err);
    return fileToDataUrl(ready);
  }
}

export async function sendChatMessage(input: {
  appointmentId: string;
  senderId: string;
  text?: string;
  file?: File;
  type?: MessageType;
  videoId?: string;
  videoUrl?: string;
  videoTitle?: string;
  href?: string;
}) {
  const id = chatIdFor(input.appointmentId);
  let type: MessageType = input.type ?? "text";
  let imageUrl: string | undefined;
  let fileUrl: string | undefined;
  if (input.videoUrl) {
    type = "video";
  } else if (input.file?.type.startsWith("image/")) {
    type = "image";
    imageUrl = await uploadChatFile(input.appointmentId, input.file, "image");
  } else if (input.file) {
    type = "prescription";
    fileUrl = await uploadChatFile(input.appointmentId, input.file, "file");
  }
  const message: ChatMessage = {
    id: `msg-${crypto.randomUUID()}`,
    senderId: input.senderId,
    text: (input.text ?? "").trim(),
    imageUrl,
    fileUrl,
    videoId: input.videoId,
    videoUrl: input.videoUrl,
    videoTitle: input.videoTitle,
    href: input.href,
    type,
    createdAt: new Date().toISOString(),
  };
  if (!isFirebaseConfigured()) {
    persistLocalMessage(id, message);
    return;
  }
  persistLocalMessage(id, message);
  try {
    const { db } = getFirebase();
    await addDoc(collection(db, "chats", id, "messages"), {
      senderId: message.senderId,
      text: message.text,
      imageUrl: imageUrl ?? null,
      fileUrl: fileUrl ?? null,
      videoId: message.videoId ?? null,
      videoUrl: message.videoUrl ?? null,
      videoTitle: message.videoTitle ?? null,
      href: message.href ?? null,
      type,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("[chat] Firestore send failed, kept local copy", err);
  }
}
