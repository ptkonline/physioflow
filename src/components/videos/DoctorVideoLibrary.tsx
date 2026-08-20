"use client";

import { VideoPlayerModal, VideoThumbCard } from "@/components/videos/VideoThumbCard";
import { VideoUploadForm } from "@/components/videos/VideoUploadForm";
import type { LibraryVideo } from "@/lib/care-types";
import { deleteLibraryVideo, subscribeDoctorVideos } from "@/lib/video-library";
import { useCurrentUser } from "@/lib/store";
import { useEffect, useState } from "react";

export function DoctorVideoLibrary() {
  const { user } = useCurrentUser();
  const [videos, setVideos] = useState<LibraryVideo[]>([]);
  const [editing, setEditing] = useState<LibraryVideo | null>(null);
  const [playing, setPlaying] = useState<LibraryVideo | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeDoctorVideos(user.id, setVideos);
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">My video library</h1>
          <p className="text-muted">Upload MP4 or MOV clips. Patients see public videos plus anything you keep private for assigned visits.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          Upload video
        </button>
      </div>
      {(showForm || editing) && (
          <VideoUploadForm
            key={editing?.id ?? "new"}
          doctorId={user.id}
          editing={editing}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <li key={video.id}>
            <VideoThumbCard
              video={video}
              onOpen={() => setPlaying(video)}
              actions={
                <div className="flex gap-2">
                  <button type="button" className="btn btn-ghost" onClick={() => { setEditing(video); setShowForm(true); }}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      if (confirm("Delete this video?")) void deleteLibraryVideo(video);
                    }}
                  >
                    Delete
                  </button>
                </div>
              }
            />
          </li>
        ))}
      </ul>
      {videos.length === 0 && <p className="card p-6 text-muted">No videos yet. Upload your first exercise clip.</p>}
      <VideoPlayerModal video={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}
