"use client";

import { ExerciseCard } from "@/components/ExerciseCard";
import { VideoPlayerModal, VideoThumbCard } from "@/components/videos/VideoThumbCard";
import type { LibraryVideo } from "@/lib/care-types";
import { CONDITIONS } from "@/lib/seed";
import { useCurrentUser, useStore } from "@/lib/store";
import type { Condition } from "@/lib/types";
import { subscribePatientVideos } from "@/lib/video-library";
import { useEffect, useMemo, useState } from "react";

export function PatientVideoLibrary() {
  const { user, profile } = useCurrentUser();
  const { state, toggleFavoriteVideo } = useStore();
  const [videos, setVideos] = useState<LibraryVideo[]>([]);
  const [playing, setPlaying] = useState<LibraryVideo | null>(null);
  const [tab, setTab] = useState<"resources" | "saved" | "starter">("resources");
  const [query, setQuery] = useState("");
  const [condition, setCondition] = useState<Condition | "all">("all");

  const extraDoctors = useMemo(
    () => [...new Set((state.bookings ?? []).filter((b) => b.patientId === user?.id).map((b) => b.physioId))],
    [state.bookings, user?.id],
  );

  useEffect(() => {
    if (!user) return;
    return subscribePatientVideos(profile?.assignedPhysioId ?? "", extraDoctors, setVideos);
  }, [user, profile?.assignedPhysioId, extraDoctors]);

  const favorites = profile?.favoriteVideoIds ?? [];
  const filtered = videos.filter((v) => {
    const q = query.toLowerCase();
    return !q || v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q) || v.category.toLowerCase().includes(q);
  });
  const shown = tab === "saved" ? filtered.filter((v) => favorites.includes(v.id)) : filtered;
  const starters = state.exercises.filter((e) => {
    const q = query.toLowerCase();
    const matchQ = e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
    return matchQ && (condition === "all" || e.condition === condition);
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">Exercise library</h1>
        <p className="text-muted">Videos from your doctor, public clips, and saved favorites.</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["resources", "Resources"],
            ["saved", "Saved"],
            ["starter", "Starter clips"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-full px-4 py-2 ring-1 ${tab === id ? "bg-teal text-white ring-teal" : "bg-elev ring-line"}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <input className="field" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
      {tab === "starter" ? (
        <>
          <select className="field md:max-w-xs" value={condition} onChange={(e) => setCondition(e.target.value as Condition | "all")}>
            <option value="all">All conditions</option>
            {CONDITIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {starters.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} href={`/patient/exercise/${exercise.id}`} />
            ))}
          </div>
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((video) => (
            <VideoThumbCard
              key={video.id}
              video={video}
              doctorName={state.users.find((u) => u.id === video.doctorId)?.name}
              favorited={favorites.includes(video.id)}
              onOpen={() => setPlaying(video)}
              onFavorite={() => user && toggleFavoriteVideo(user.id, video.id)}
            />
          ))}
        </div>
      )}
      {tab !== "starter" && shown.length === 0 && (
        <p className="card p-6 text-muted">
          {tab === "saved" ? "Save a video from Resources to find it here." : "No videos yet from your doctor."}
        </p>
      )}
      <VideoPlayerModal video={playing} onClose={() => setPlaying(null)} />
    </div>
  );
}
