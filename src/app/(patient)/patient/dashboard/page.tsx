"use client";

import { conditionLabel } from "@/components/Sparkline";
import { useCurrentUser, useStore } from "@/lib/store";
import { Bell, StretchHorizontal, Video } from "lucide-react";
import Link from "next/link";

export default function PatientDashboardPage() {
  const { user, profile } = useCurrentUser();
  const { state } = useStore();
  if (!user) return null;
  if (!profile) {
    return (
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">Your profile is still being created</h1>
        <p className="mt-2 text-muted">Open Doctors to book, or sign out and register again as a patient.</p>
        <Link href="/patient/book-appointment" className="btn btn-primary mt-4">
          Browse doctors
        </Link>
      </div>
    );
  }

  const program = state.programs.find((p) => p.patientId === user.id && p.status === "active");
  const todayDone = state.completions.filter(
    (c) => c.patientId === user.id && new Date(c.completedAt).toDateString() === new Date().toDateString(),
  ).length;
  const nextCall = state.consults
    .filter((c) => c.patientId === user.id && c.status === "upcoming")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
  const unread = state.notifications.filter((n) => n.userId === user.id && !n.read).length;
  const physio = state.users.find((u) => u.id === profile.assignedPhysioId);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-muted">Hello</p>
        <h1 className="text-3xl font-semibold">{user.name}</h1>
        <p className="mt-1 text-muted">
          {conditionLabel(profile.condition)} · Goal: {profile.goal}
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="card p-5">
          <p className="text-sm text-muted">Today</p>
          <p className="mt-1 text-3xl font-semibold">{todayDone}</p>
          <p className="text-muted">exercises completed</p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-muted">Your clinician</p>
          <p className="mt-1 text-xl font-semibold">{physio?.name}</p>
          <p className="text-muted">{profile.diagnosis}</p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-muted">Unread reminders</p>
          <p className="mt-1 text-3xl font-semibold">{unread}</p>
          <Link href="/patient/notifications">Open inbox</Link>
        </article>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="card p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <StretchHorizontal size={20} /> Today’s program
          </h2>
          {program ? (
            <ul className="mt-4 space-y-3">
              {program.items.map((item) => {
                const ex = state.exercises.find((e) => e.id === item.exerciseId);
                return (
                  <li key={item.exerciseId} className="flex items-center justify-between gap-3">
                    <span>{ex?.name}</span>
                    <span className="text-muted">
                      {item.sets} × {item.reps}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-muted">No program yet. Your clinician will assign one soon.</p>
          )}
          <Link href="/patient/program" className="btn btn-primary mt-4">
            Start exercises
          </Link>
        </article>
        <article className="card p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Video size={20} /> Next video visit
          </h2>
          {nextCall ? (
            <>
              <p className="mt-3 text-lg font-medium">{nextCall.topic}</p>
              <p className="text-muted">
                {new Date(nextCall.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </p>
              <Link href={`/consult/${nextCall.id}`} className="btn btn-primary mt-4">
                Join visit
              </Link>
            </>
          ) : (
            <p className="mt-3 text-muted">No visits yet. Book a doctor when you are ready.</p>
          )}
          <Link href="/patient/book-appointment" className="btn btn-ghost mt-3">
            Browse doctors
          </Link>
        </article>
      </div>
      <Link href="/patient/progress" className="card p-4 no-underline">
        Daily check-in — log exercises and pain for your doctor.
      </Link>
      <Link href="/patient/notifications" className="card flex items-center gap-3 p-4 no-underline">
        <Bell /> Keep notifications on so you do not miss exercises or visits.
      </Link>
      <Link href="/patient/feedback" className="card p-4 no-underline">
        Rate a visit or exercise — your clinician sees this on your record.
      </Link>
    </div>
  );
}
