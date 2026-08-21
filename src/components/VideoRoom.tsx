"use client";

import {
  ensureCallRoom,
  rtcConfig,
  sendCallSignal,
  subscribeCallSignals,
  type CallRoomMeta,
  type CallSignal,
} from "@/lib/webrtc-signaling";
import { isFirebaseConfigured } from "@/lib/firebase-config";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

function mediaErrorMessage(err: unknown) {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Camera or microphone permission was denied. Allow access in the browser and try again.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera or microphone was found on this device.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "The camera is already in use by another app.";
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "Video needs HTTPS (or localhost). Open the app from http://localhost:3000.";
  }
  return "Could not start the camera. Check permissions and your connection.";
}

export function VideoRoom({
  room,
  localUserId,
  localName,
  remoteName,
  isCaller,
  onLeave,
  onJoin,
}: {
  room: CallRoomMeta;
  localUserId: string;
  localName: string;
  remoteName: string;
  isCaller: boolean;
  onLeave: () => void;
  onJoin?: () => void;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const makingOffer = useRef(false);
  const seen = useRef(new Set<string>());
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const unsubRef = useRef<() => void>(() => {});
  const chain = useRef(Promise.resolve());
  const handleRef = useRef<(signal: CallSignal) => Promise<void>>(async () => undefined);

  const [live, setLive] = useState(false);
  const [remoteLive, setRemoteLive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [status, setStatus] = useState("Waiting to join");
  const [error, setError] = useState<string | null>(null);

  const attachRemote = useCallback((stream: MediaStream) => {
    const node = remoteRef.current;
    if (!node) return;
    node.srcObject = stream;
    void node.play().catch(() => undefined);
    setRemoteLive(true);
  }, []);

  const flushIce = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription) return;
    const queued = pendingIce.current.splice(0);
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        /* stale candidate */
      }
    }
  }, []);

  const handleSignal = useCallback(
    async (signal: CallSignal) => {
      if (signal.from === localUserId) return;
      if (seen.current.has(signal.id)) return;
      seen.current.add(signal.id);
      const pc = pcRef.current;
      if (!pc) return;

      try {
        if (signal.kind === "offer" && !isCaller) {
          setStatus("Incoming call — connecting");
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          await flushIce(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendCallSignal(room.roomId, localUserId, "answer", { type: answer.type, sdp: answer.sdp });
          setStatus("Connected");
        } else if (signal.kind === "answer" && isCaller) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          await flushIce(pc);
          setStatus("Connected");
        } else if (signal.kind === "ice") {
          const candidate = signal.payload;
          if (!pc.remoteDescription) {
            pendingIce.current.push(candidate);
            return;
          }
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Signaling failed. Rejoin the visit.");
      }
    },
    [flushIce, isCaller, localUserId, room.roomId],
  );

  handleRef.current = handleSignal;

  useEffect(() => {
    return () => {
      unsubRef.current();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, []);

  async function join() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (localRef.current) {
        localRef.current.srcObject = stream;
        await localRef.current.play().catch(() => undefined);
      }

      const pc = new RTCPeerConnection(rtcConfig());
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) attachRemote(remoteStream);
      };
      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        void sendCallSignal(room.roomId, localUserId, "ice", event.candidate.toJSON());
      };
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") setStatus("Connected");
        if (state === "disconnected") setStatus("Network hiccup — waiting");
        if (state === "failed") setError("Peer connection failed. Check the network or add a TURN server.");
        if (state === "closed") setStatus("Call ended");
      };

      await ensureCallRoom(room);
      seen.current = new Set();
      pendingIce.current = [];
      unsubRef.current();
      unsubRef.current = subscribeCallSignals(
        room.roomId,
        (signal) => {
          chain.current = chain.current.then(() => handleRef.current(signal)).catch(() => undefined);
        },
        setError,
      );

      if (isCaller) {
        makingOffer.current = true;
        setStatus("Calling the other participant…");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendCallSignal(room.roomId, localUserId, "offer", { type: offer.type, sdp: offer.sdp });
        makingOffer.current = false;
      } else {
        setStatus("Waiting for the doctor to start the call…");
      }

      setLive(true);
      onJoin?.();
    } catch (err) {
      setError(mediaErrorMessage(err));
    }
  }

  function leave() {
    unsubRef.current();
    unsubRef.current = () => {};
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    setLive(false);
    setRemoteLive(false);
    onLeave();
  }

  function toggleMute() {
    const next = !muted;
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    setMuted(next);
  }

  function toggleCam() {
    const next = !camOff;
    streamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
    setCamOff(next);
  }

  return (
    <div className="space-y-4">
      <p className="text-muted">{status}</p>
      {!isFirebaseConfigured() && (
        <p className="text-sm text-amber">
          Firebase is not configured. Signaling stays in this browser only. Add NEXT_PUBLIC_FIREBASE_* keys for a
          two-device call.
        </p>
      )}
      {error ? <p className="text-rose">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink lg:col-span-2">
          <video
            ref={remoteRef}
            className="h-full w-full object-cover"
            playsInline
            autoPlay
          />
          {!remoteLive && (
            <div className="absolute inset-0 grid place-items-center text-white">
              {live ? `Waiting for ${remoteName}…` : "Join to start the visit"}
            </div>
          )}
          <video
            ref={localRef}
            className="absolute bottom-3 right-3 h-28 w-40 rounded-xl object-cover ring-2 ring-white/70"
            playsInline
            muted
            autoPlay
          />
        </div>
        <div className="card flex flex-col p-5">
          <p className="text-sm text-muted">Room {room.roomId}</p>
          <p className="mt-2 font-semibold">{localName}</p>
          <p className="text-muted">with {remoteName}</p>
          <p className="mt-4 text-sm text-muted">
            Both people must open the same visit URL. The doctor starts the offer; the patient answers automatically.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {!live ? (
          <button type="button" className="btn btn-primary" onClick={() => void join()}>
            <Video size={18} /> Join visit
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={toggleMute}>
              {muted ? <MicOff size={18} /> : <Mic size={18} />} {muted ? "Unmute" : "Mute"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={toggleCam}>
              {camOff ? <VideoOff size={18} /> : <Video size={18} />} {camOff ? "Camera on" : "Camera off"}
            </button>
            <button type="button" className="btn bg-rose text-white" onClick={leave}>
              <PhoneOff size={18} /> End visit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
