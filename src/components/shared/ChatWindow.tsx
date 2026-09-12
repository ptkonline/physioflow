"use client";

import { VideoPlayer } from "@/components/videos/VideoPlayer";
import { ensureChatRoom, sendChatMessage, subscribeMessages } from "@/lib/chat";
import type { ChatMessage, LibraryVideo } from "@/lib/care-types";
import { subscribeDoctorVideos } from "@/lib/video-library";
import { enqueueOffline } from "@/lib/offline-idb";
import { ImagePlus, Library, Send, Video } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

export function ChatWindow({
  appointmentId,
  patientId,
  doctorId,
  patientEmail,
  doctorEmail,
  currentUserId,
  currentIsPatient,
}: {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  patientEmail: string;
  doctorEmail: string;
  currentUserId: string;
  currentIsPatient: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const [library, setLibrary] = useState<LibraryVideo[]>([]);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};
    void ensureChatRoom({ appointmentId, patientId, doctorId, patientEmail, doctorEmail })
      .then(() => {
        if (cancelled) return;
        unsub = subscribeMessages(appointmentId, setMessages, setError);
        if (cancelled) unsub();
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not open this chat.");
      });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [appointmentId, patientId, doctorId, patientEmail, doctorEmail]);

  useEffect(() => {
    if (currentIsPatient) return;
    return subscribeDoctorVideos(doctorId, setLibrary);
  }, [currentIsPatient, doctorId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(file?: File, video?: LibraryVideo) {
    if (busy) return;
    if (!file && !video && !text.trim()) return;
    setBusy(true);
    try {
      if (!navigator.onLine) {
        await enqueueOffline({
          id: crypto.randomUUID(),
          kind: "chat",
          createdAt: new Date().toISOString(),
          payload: {
            appointmentId,
            senderId: currentUserId,
            text: video ? text || `Exercise: ${video.title}` : text,
            patientId,
            doctorId,
            patientEmail,
            doctorEmail,
          },
        });
        setText("");
        setPicker(false);
        setError("Saved offline. It will send when you are back online.");
        return;
      }
      await sendChatMessage({
        appointmentId,
        senderId: currentUserId,
        text: video ? text || `Exercise: ${video.title}` : text,
        file,
        videoId: video?.id,
        videoUrl: video?.videoUrl,
        videoTitle: video?.title,
      });
      setText("");
      setPicker(false);
    } catch {
      await enqueueOffline({
        id: crypto.randomUUID(),
        kind: "chat",
        createdAt: new Date().toISOString(),
        payload: {
          appointmentId,
          senderId: currentUserId,
          text,
          patientId,
          doctorId,
          patientEmail,
          doctorEmail,
        },
      });
      setText("");
      setError("Saved offline. It will send when you are back online.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send();
  }

  return (
    <div className="card flex h-[min(70vh,640px)] flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {error && <p className="text-rose">{error}</p>}
        {messages.length === 0 && !error && <p className="text-muted">No messages yet. Say hello to start the visit thread.</p>}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          const patientSide = currentIsPatient ? mine : !mine;
          return (
            <div key={m.id} className={`flex ${patientSide ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  patientSide ? "bg-teal text-white" : "bg-sage text-teal-dark"
                }`}
              >
                {m.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageUrl} alt="" className="mb-2 max-h-48 rounded-xl object-cover" loading="lazy" />
                )}
                {m.fileUrl && (
                  <a className="underline" href={m.fileUrl} target="_blank" rel="noreferrer">
                    Download file
                  </a>
                )}
                {m.type === "video" && m.videoUrl && (
                  <div className="mb-2 overflow-hidden rounded-xl">
                    <VideoPlayer src={m.videoUrl} title={m.videoTitle || "Exercise video"} />
                    {m.videoTitle && <p className="mt-1 text-sm font-medium">{m.videoTitle}</p>}
                  </div>
                )}
                {m.text && <p>{m.text}</p>}
                {(m.type === "call" || m.href) && m.href && (
                  <Link
                    href={m.href}
                    className={`mt-2 inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-semibold no-underline ${
                      patientSide ? "bg-white text-teal" : "bg-teal text-white"
                    }`}
                  >
                    <Video size={14} /> Join Call
                  </Link>
                )}
                <p className={`mt-1 text-xs ${patientSide ? "text-white/80" : "text-muted"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {picker && !currentIsPatient && (
        <div className="max-h-40 overflow-y-auto border-t border-line p-3">
          <p className="mb-2 text-sm font-medium">Share from My Video Library</p>
          <ul className="space-y-2">
            {library.map((video) => (
              <li key={video.id}>
                <button type="button" className="btn btn-ghost w-full justify-start" onClick={() => void send(undefined, video)}>
                  {video.title} · {video.category}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <form onSubmit={onSubmit} className="flex gap-2 border-t border-line p-3">
        <input
          ref={fileRef}
          className="sr-only"
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void send(file);
          }}
        />
        <button type="button" className="btn btn-ghost px-3" onClick={() => fileRef.current?.click()} aria-label="Attach">
          <ImagePlus size={18} />
        </button>
        {!currentIsPatient && (
          <button type="button" className="btn btn-ghost px-3" onClick={() => setPicker((v) => !v)} aria-label="Share video">
            <Library size={18} />
          </button>
        )}
        <input
          className="field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message"
        />
        <button className="btn btn-primary px-3" type="submit" disabled={busy} aria-label="Send">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
