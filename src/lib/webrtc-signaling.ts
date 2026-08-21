import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { isFirebaseConfigured } from "./firebase-config";
import { getFirebase } from "./firebase";

export type SignalKind = "offer" | "answer" | "ice";

export type CallSignal = {
  id: string;
  kind: SignalKind;
  from: string;
  payload: Record<string, unknown>;
};

export type CallRoomMeta = {
  roomId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  patientEmail: string;
  doctorEmail: string;
};

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

export function rtcConfig(): RTCConfiguration {
  const turn = process.env.NEXT_PUBLIC_TURN_URL?.trim();
  const user = process.env.NEXT_PUBLIC_TURN_USERNAME?.trim();
  const cred = process.env.NEXT_PUBLIC_TURN_CREDENTIAL?.trim();
  const iceServers = [...ICE_SERVERS];
  if (turn) iceServers.push({ urls: turn, username: user, credential: cred });
  return { iceServers, iceCandidatePoolSize: 8 };
}

function channel(roomId: string) {
  return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(`pf-call-${roomId}`);
}

export async function ensureCallRoom(meta: CallRoomMeta) {
  if (!isFirebaseConfigured()) return;
  const { db } = getFirebase();
  await setDoc(
    doc(db, "calls", meta.roomId),
    {
      appointmentId: meta.appointmentId,
      patientId: meta.patientId,
      doctorId: meta.doctorId,
      patientEmail: meta.patientEmail.trim().toLowerCase(),
      doctorEmail: meta.doctorEmail.trim().toLowerCase(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function sendCallSignal(roomId: string, from: string, kind: SignalKind, payload: Record<string, unknown>) {
  const body: CallSignal = { id: crypto.randomUUID(), kind, from, payload };
  channel(roomId)?.postMessage(body);
  if (!isFirebaseConfigured()) return;
  const { db } = getFirebase();
  await addDoc(collection(db, "calls", roomId, "signals"), {
    kind,
    from,
    payload,
    createdAt: serverTimestamp(),
  });
}

export function subscribeCallSignals(
  roomId: string,
  onSignal: (signal: CallSignal) => void,
  onError?: (message: string) => void,
): () => void {
  const local = channel(roomId);
  const onLocal = (event: MessageEvent<CallSignal>) => {
    if (event.data?.kind && event.data.from) onSignal(event.data);
  };
  local?.addEventListener("message", onLocal);

  if (!isFirebaseConfigured()) {
    return () => local?.close();
  }

  const { db } = getFirebase();
  const unsub = onSnapshot(
    query(collection(db, "calls", roomId, "signals")),
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type !== "added") return;
        const data = change.doc.data();
        onSignal({
          id: change.doc.id,
          kind: data.kind as SignalKind,
          from: String(data.from ?? ""),
          payload: (data.payload as Record<string, unknown>) ?? {},
        });
      });
    },
    (err) => onError?.(err.message),
  );

  return () => {
    unsub();
    local?.close();
  };
}
