import { VIDEO_MAX_BYTES } from "./firestore-schema";

export function isAllowedVideoFile(file: File) {
  const name = file.name.toLowerCase();
  const typeOk = ["video/mp4", "video/quicktime", "video/x-m4v", "video/mpeg"].includes(file.type);
  const extOk = name.endsWith(".mp4") || name.endsWith(".mov") || name.endsWith(".m4v");
  return (typeOk || extOk) && file.size > 0 && file.size <= VIDEO_MAX_BYTES;
}

export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function readVideoMetadata(file: File): Promise<{ duration: number; thumbnail: Blob }> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read this video file"));
      video.src = url;
    });
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    video.currentTime = Math.min(1, duration / 4 || 0);
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      setTimeout(resolve, 800);
    });
    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 360;
    const scale = Math.min(1, 720 / Math.max(w, h));
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not capture a thumbnail");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const thumbnail = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Thumbnail failed"))), "image/jpeg", 0.72);
    });
    return { duration, thumbnail };
  } finally {
    URL.revokeObjectURL(url);
  }
}
