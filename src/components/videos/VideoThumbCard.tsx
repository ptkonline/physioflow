"use client";

import { VideoPlayer } from "@/components/videos/VideoPlayer";
import type { LibraryVideo } from "@/lib/care-types";
import { formatDuration } from "@/lib/video-meta";
import { Heart, Play, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { resolveVideoSrc } from "@/lib/video-idb";

export function VideoThumbCard({
  video,
  doctorName,
  favorited,
  onOpen,
  onFavorite,
  actions,
}: {
  video: LibraryVideo;
  doctorName?: string;
  favorited?: boolean;
  onOpen: () => void;
  onFavorite?: () => void;
  actions?: ReactNode;
}) {
  const [thumb, setThumb] = useState(video.thumbnailUrl.startsWith("idb:") ? "" : video.thumbnailUrl);
  useEffect(() => {
    if (!video.thumbnailUrl) return;
    void resolveVideoSrc(video.thumbnailUrl).then(setThumb);
  }, [video.thumbnailUrl]);

  return (
    <article className="card overflow-hidden">
      <button type="button" className="relative block h-40 w-full bg-sand" onClick={onOpen}>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <span className="grid h-full place-items-center text-muted">No thumbnail</span>
        )}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-sm text-white">
          <Play size={14} /> {formatDuration(video.duration)}
        </span>
      </button>
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="chip">{video.category}</span>
          {onFavorite && (
            <button type="button" className="btn btn-ghost px-2 py-1" onClick={onFavorite} aria-label="Save video">
              <Heart size={18} className={favorited ? "fill-current text-teal" : ""} />
            </button>
          )}
        </div>
        <h3 className="text-lg font-semibold">{video.title}</h3>
        <p className="text-muted">{video.description}</p>
        {doctorName && <p className="text-sm text-muted">{doctorName}</p>}
        {video.isPublic ? <p className="text-xs text-muted">Public library</p> : <p className="text-xs text-muted">Assigned patients only</p>}
        {actions}
      </div>
    </article>
  );
}

export function VideoPlayerModal({
  video,
  onClose,
}: {
  video: LibraryVideo | null;
  onClose: () => void;
}) {
  if (!video) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal>
      <div className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{video.title}</h2>
            <p className="text-muted">{video.category}</p>
          </div>
          <button type="button" className="btn btn-ghost px-3" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <VideoPlayer src={video.videoUrl} poster={video.thumbnailUrl} title={video.title} />
        <p className="mt-3 text-muted">{video.description}</p>
      </div>
    </div>
  );
}
