"use client";

import { useEffect, useState } from "react";
import { resolveVideoSrc } from "@/lib/video-idb";

export function VideoPlayer({
  src,
  poster,
  title,
  className = "w-full rounded-2xl bg-black",
}: {
  src: string;
  poster?: string;
  title: string;
  className?: string;
}) {
  const [resolved, setResolved] = useState(src.startsWith("idb:") ? "" : src);
  const [thumb, setThumb] = useState(poster && !poster.startsWith("idb:") ? poster : "");

  useEffect(() => {
    let cancelled = false;
    void resolveVideoSrc(src).then((url) => {
      if (!cancelled) setResolved(url);
    });
    if (poster) {
      void resolveVideoSrc(poster).then((url) => {
        if (!cancelled) setThumb(url);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [src, poster]);

  if (!resolved) {
    return <div className={`${className} aspect-video animate-pulse bg-sand`} aria-hidden />;
  }

  return (
    <video
      className={className}
      controls
      playsInline
      preload="metadata"
      poster={thumb || undefined}
      title={title}
      src={resolved}
    >
      Your browser does not support HTML5 video.
    </video>
  );
}
