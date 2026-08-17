"use client";

import { formatDateTime } from "@/lib/format";
import { useCurrentUser, useStore } from "@/lib/store";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function VideoCall({ consultId }: { consultId: string }) {
  const { state, setConsultStatus } = useStore();
  const { user } = useCurrentUser();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consult = state.consults.find((c) => c.id === consultId);
  const other = consult
    ? state.users.find((u) => (user?.role === "physio" ? u.id === consult.patientId : u.id === consult.physioId))
    : null;

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function join() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
      if (consult) setConsultStatus(consult.id, "live");
    } catch {
      setError("Camera or microphone was blocked. You can still stay in the visit room.");
    }
  }

  function leave() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLive(false);
    if (consult) setConsultStatus(consult.id, "completed");
    router.push(user?.role === "physio" ? "/physio/consults" : "/patient/consults");
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

  if (!consult) return <p>Visit not found.</p>;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-semibold">{consult.topic}</h1>
        <p className="text-muted">
          {other?.name} · {formatDateTime(consult.scheduledAt)} · {consult.durationMin} min
        </p>
      </header>
      {error ? <p className="text-rose">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink lg:col-span-2">
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
          {!live ? (
            <div className="absolute inset-0 grid place-items-center text-white">
              Join to start your camera
            </div>
          ) : null}
        </div>
        <div className="card flex flex-col p-5">
          <p className="text-sm text-muted">Secure room</p>
          <div className="mt-3 grid flex-1 place-items-center rounded-xl bg-sage/50 p-6 text-center">
            <p>
              {other?.name}
              <br />
              Encrypted video in production uses a HIPAA-eligible media server.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {!live ? (
          <button type="button" className="btn btn-primary" onClick={join}>
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

export default VideoCall;
