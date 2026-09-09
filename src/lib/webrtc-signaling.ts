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

export type SignalKind = "offer" | "answer" | "ice" | "hangup" | "missed";

export type CallSignal =
  | {
      id: string;
      kind: "offer" | "answer";
      from: string;
      payload: RTCSessionDescriptionInit;
    }
  | {
      id: string;
      kind: "ice";
      from: string;
      payload: RTCIceCandidateInit;
    }
  | {
      id: string;
      kind: "hangup" | "missed";
      from: string;
      payload: Record<string, never>;
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

export async function sendCallSignal(
  roomId: string,
  from: string,
  kind: "offer" | "answer",
  payload: RTCSessionDescriptionInit,
): Promise<void>;
export async function sendCallSignal(
  roomId: string,
  from: string,
  kind: "ice",
  payload: RTCIceCandidateInit,
): Promise<void>;
export async function sendCallSignal(
  roomId: string,
  from: string,
  kind: "hangup" | "missed",
  payload?: Record<string, never>,
): Promise<void>;
export async function sendCallSignal(
  roomId: string,
  from: string,
  kind: SignalKind,
  payload?: RTCSessionDescriptionInit | RTCIceCandidateInit | Record<string, never>,
) {
  const body: CallSignal =
    kind === "ice"
      ? { id: crypto.randomUUID(), kind, from, payload: (payload as RTCIceCandidateInit) ?? {} }
      : kind === "hangup" || kind === "missed"
        ? { id: crypto.randomUUID(), kind, from, payload: {} }
        : { id: crypto.randomUUID(), kind, from, payload: (payload as RTCSessionDescriptionInit) ?? { type: "offer" } };
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
        const kind = data.kind as SignalKind;
        const from = String(data.from ?? "");
        if (kind === "ice") {
          onSignal({
            id: change.doc.id,
            kind,
            from,
            payload: (data.payload as RTCIceCandidateInit) ?? {},
          });
          return;
        }
        if (kind === "hangup" || kind === "missed") {
          onSignal({ id: change.doc.id, kind, from, payload: {} });
          return;
        }
        onSignal({
          id: change.doc.id,
          kind,
          from,
          payload: (data.payload as RTCSessionDescriptionInit) ?? { type: "offer" },
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
