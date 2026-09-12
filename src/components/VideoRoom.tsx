"use client";

import {
  ensureCallRoom,
  rtcConfig,
  sendCallSignal,
  subscribeCallSignals,
  type CallRoomMeta,
  type CallSignal,
} from "@/lib/webrtc-signaling";
import { MISSED_CALL_MS } from "@/lib/call-window";
import { isFirebaseConfigured } from "@/lib/firebase-config";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
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
  onMissed,
}: {
  room: CallRoomMeta;
  localUserId: string;
  localName: string;
  remoteName: string;
  isCaller: boolean;
  onLeave: () => void;
  onJoin?: () => void;
  onMissed?: () => void;
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
  const [audioOnly, setAudioOnly] = useState(false);
  const audioOnlyRef = useRef(false);
  const remoteLiveRef = useRef(false);
  const missedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [turnReady, setTurnReady] = useState<boolean | null>(null);

  const clearMissedTimer = useCallback(() => {
    if (missedTimerRef.current) {
      clearTimeout(missedTimerRef.current);
      missedTimerRef.current = null;
    }
  }, []);

  const attachRemote = useCallback((stream: MediaStream) => {
    const node = remoteRef.current;
    if (!node) return;
    node.srcObject = stream;
    void node.play().catch(() => undefined);
    setRemoteLive(true);
    remoteLiveRef.current = true;
    clearMissedTimer();
  }, [clearMissedTimer]);

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
      if (signal.kind === "missed") {
        onMissed?.();
        setStatus("Missed call");
        return;
      }
      if (signal.kind === "hangup") {
        setStatus("The other person left the call");
        return;
      }
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
    [flushIce, isCaller, localUserId, onMissed, room.roomId],
  );

  handleRef.current = handleSignal;

  useEffect(() => {
    return () => {
      clearMissedTimer();
      unsubRef.current();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, [clearMissedTimer]);

  async function join(voiceOnly = false) {
    setError(null);
    audioOnlyRef.current = voiceOnly;
    setAudioOnly(voiceOnly);
    setCamOff(voiceOnly);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: voiceOnly ? false : { facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (localRef.current) {
        localRef.current.srcObject = stream;
        await localRef.current.play().catch(() => undefined);
      }

      let config = rtcConfig();
      try {
        const ice = await fetch("/api/ice");
        const body = (await ice.json()) as { iceServers?: RTCIceServer[]; turnReady?: boolean };
        if (body.iceServers?.length) config = { iceServers: body.iceServers, iceCandidatePoolSize: 8 };
        setTurnReady(Boolean(body.turnReady));
      } catch {
        setTurnReady(false);
      }

      const pc = new RTCPeerConnection(config);
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
      if (isCaller) {
        clearMissedTimer();
        missedTimerRef.current = setTimeout(() => {
          if (remoteLiveRef.current) return;
          void (async () => {
            try {
              await sendCallSignal(room.roomId, localUserId, "missed");
            } catch {
              /* optional */
            }
            setStatus("Patient did not join — marked missed");
            onMissed?.();
          })();
        }, MISSED_CALL_MS);
      }
    } catch (err) {
      setError(mediaErrorMessage(err));
    }
  }

  async function leave() {
    clearMissedTimer();
    const missed = isCaller && !remoteLiveRef.current && live;
    try {
      await sendCallSignal(room.roomId, localUserId, missed ? "missed" : "hangup");
    } catch {
      /* signaling optional on hangup */
    }
    unsubRef.current();
    unsubRef.current = () => {};
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    setLive(false);
    setRemoteLive(false);
    remoteLiveRef.current = false;
    if (missed) onMissed?.();
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

  async function switchToAudioOnly() {
    if (audioOnly) return;
    setAudioOnly(true);
    audioOnlyRef.current = true;
    setCamOff(true);
    streamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = false;
      t.stop();
      streamRef.current?.removeTrack(t);
      pcRef.current?.getSenders().forEach((sender) => {
        if (sender.track?.kind === "video") void sender.replaceTrack(null);
      });
    });
    setStatus("Switched to audio-only");
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
      {turnReady === false && (
        <p className="text-sm text-amber">
          TURN is not configured. Some mobile networks will fail. Set TURN_URL, TURN_USERNAME, and TURN_CREDENTIAL on
          the server (Metered or Twilio).
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
          <>
            <button type="button" className="btn btn-primary" onClick={() => void join(false)}>
              <Video size={18} /> Join video
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void join(true)}>
              <Phone size={18} /> Voice only
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-ghost" onClick={toggleMute}>
              {muted ? <MicOff size={18} /> : <Mic size={18} />} {muted ? "Unmute" : "Mute"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={toggleCam} disabled={audioOnly}>
              {camOff || audioOnly ? <VideoOff size={18} /> : <Video size={18} />}{" "}
              {audioOnly ? "Voice call" : camOff ? "Camera on" : "Camera off"}
            </button>
            {!audioOnly && (
              <button type="button" className="btn btn-ghost" onClick={() => void switchToAudioOnly()}>
                <Phone size={18} /> Switch to audio-only
              </button>
            )}
            <button type="button" className="btn bg-rose text-white" onClick={() => void leave()}>
              <PhoneOff size={18} /> End visit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
