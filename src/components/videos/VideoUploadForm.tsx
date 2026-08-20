"use client";

import { VIDEO_ACCEPT, VIDEO_CATEGORIES, VIDEO_MAX_BYTES } from "@/lib/firestore-schema";
import { uploadLibraryVideo, updateLibraryVideo, type VideoUploadInput } from "@/lib/video-library";
import { isAllowedVideoFile, readVideoMetadata } from "@/lib/video-meta";
import type { LibraryVideo } from "@/lib/care-types";
import { FormEvent, useState } from "react";

export function VideoUploadForm({
  doctorId,
  editing,
  onSaved,
  onCancel,
}: {
  doctorId: string;
  editing?: LibraryVideo | null;
  onSaved: (video: LibraryVideo) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [category, setCategory] = useState(editing?.category ?? VIDEO_CATEGORIES[0]);
  const [isPublic, setIsPublic] = useState(editing?.isPublic ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [duration, setDuration] = useState(editing?.duration ?? 0);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onVideoPicked(next: File | null) {
    setFile(next);
    setError("");
    if (!next) return;
    if (!isAllowedVideoFile(next)) {
      setFile(null);
      setError(`Use an MP4 or MOV file under ${Math.round(VIDEO_MAX_BYTES / (1024 * 1024))} MB.`);
      return;
    }
    try {
      const meta = await readVideoMetadata(next);
      setDuration(meta.duration);
      if (!thumb) setThumb(new File([meta.thumbnail], "thumb.jpg", { type: "image/jpeg" }));
    } catch {
      setError("Could not read duration from this file. You can still upload it.");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (!title.trim()) {
      setError("Add a title.");
      return;
    }
    setBusy(true);
    try {
      if (editing && !file) {
        const saved = await updateLibraryVideo(editing, {
          title,
          description,
          category,
          isPublic,
          duration,
        });
        onSaved(saved);
        return;
      }
      if (!file) {
        setError("Choose an MP4 or MOV file.");
        return;
      }
      const input: VideoUploadInput = {
        doctorId,
        title,
        description,
        category,
        duration,
        isPublic,
        video: file,
        thumbnail: thumb ?? undefined,
        onProgress: setProgress,
      };
      const saved = await uploadLibraryVideo(input);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <h2 className="text-xl font-semibold">{editing ? "Edit video" : "Upload exercise video"}</h2>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Title</span>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Description</span>
        <textarea className="field min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Category</span>
        <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
          {VIDEO_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        Visible in the public exercise library
      </label>
      {!editing && (
        <label className="block space-y-1">
          <span className="text-sm font-medium">Video (MP4 or MOV)</span>
          <input
            className="field"
            type="file"
            accept={VIDEO_ACCEPT}
            onChange={(e) => void onVideoPicked(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
      <label className="block space-y-1">
        <span className="text-sm font-medium">Thumbnail (optional — we capture a frame if you skip this)</span>
        <input
          className="field"
          type="file"
          accept="image/*"
          onChange={(e) => setThumb(e.target.files?.[0] ?? null)}
        />
      </label>
      {duration > 0 && <p className="text-sm text-muted">Duration: {Math.round(duration)} seconds</p>}
      {busy && (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-sand">
            <div className="h-full bg-teal" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-sm text-muted">{progress}% uploaded</p>
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {editing ? "Save changes" : "Upload"}
        </button>
        {onCancel && (
          <button className="btn btn-ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
