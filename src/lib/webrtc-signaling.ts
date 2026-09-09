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

export type CallStatus = "ringing" | "live" | "ended" | "missed";

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
  if (turn) {
    iceServers.push({ urls: turn, username: user, credential: cred });
  } else if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.warn("[webrtc] NEXT_PUBLIC_TURN_URL not set — STUN-only; many NATs will fail.");
  }
  return { iceServers, iceCandidatePoolSize: 8 };
}

function channel(roomId: string) {
  return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(`pf-call-${roomId}`);
}

function lsKey(roomId: string) {
  return `physioflow.call.signals.${roomId}`;
}

function publishLocalSignal(roomId: string, body: CallSignal) {
  channel(roomId)?.postMessage(body);
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(lsKey(roomId));
    const list = raw ? (JSON.parse(raw) as CallSignal[]) : [];
    list.push(body);
    // Keep a short ring buffer so tabs can catch up.
    localStorage.setItem(lsKey(roomId), JSON.stringify(list.slice(-40)));
  } catch {
    /* quota / private mode */
  }
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
      status: "ringing" satisfies CallStatus,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function markCallStatus(
  roomId: string,
  status: CallStatus,
  from: string,
  extras?: { appointmentId?: string },
) {
  const meta = {
    status,
    updatedBy: from,
    updatedAt: new Date().toISOString(),
    ...(status === "missed" ? { missedAt: new Date().toISOString(), missedBy: from } : {}),
    ...extras,
  };
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(`physioflow.call.meta.${roomId}`, JSON.stringify(meta));
    } catch {
      /* ignore */
    }
  }
  if (!isFirebaseConfigured()) return;
  const { db } = getFirebase();
  await setDoc(doc(db, "calls", roomId), { ...meta, updatedAt: serverTimestamp() }, { merge: true });
  await setDoc(doc(db, "calls", roomId, "metadata", "current"), { ...meta, updatedAt: serverTimestamp() }, { merge: true });
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
  publishLocalSignal(roomId, body);
  if (kind === "missed") {
    await markCallStatus(roomId, "missed", from);
  } else if (kind === "hangup") {
    await markCallStatus(roomId, "ended", from);
  } else if (kind === "offer" || kind === "answer") {
    await markCallStatus(roomId, kind === "answer" ? "live" : "ringing", from);
  }
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
  const seen = new Set<string>();
  const deliver = (signal: CallSignal) => {
    if (!signal?.kind || !signal.from || seen.has(signal.id)) return;
    seen.add(signal.id);
    onSignal(signal);
  };

  const local = channel(roomId);
  const onLocal = (event: MessageEvent<CallSignal>) => deliver(event.data);
  local?.addEventListener("message", onLocal);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== lsKey(roomId) || !event.newValue) return;
    try {
      const list = JSON.parse(event.newValue) as CallSignal[];
      const last = list[list.length - 1];
      if (last) deliver(last);
    } catch {
      /* ignore */
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  if (!isFirebaseConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[webrtc] Firebase missing — using BroadcastChannel + localStorage signaling (same browser only).");
    }
    return () => {
      local?.close();
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
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
          deliver({
            id: change.doc.id,
            kind,
            from,
            payload: (data.payload as RTCIceCandidateInit) ?? {},
          });
          return;
        }
        if (kind === "hangup" || kind === "missed") {
          deliver({ id: change.doc.id, kind, from, payload: {} });
          return;
        }
        deliver({
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
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}
