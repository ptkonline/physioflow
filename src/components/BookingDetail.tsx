"use client";

import { callWindowHint, consultHref, isCallWindowOpen } from "@/lib/call-window";
import { formatSlot } from "@/lib/availability";
import { alertPatientCallStarted } from "@/lib/start-video-call";
import { useCurrentUser, useStore } from "@/lib/store";
import { Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function BookingDetail({ bookingId }: { bookingId: string }) {
  const { user } = useCurrentUser();
  const { state, addNotification } = useStore();
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const booking = (state.bookings ?? []).find((b) => b.id === bookingId);
  const doctor = booking ? state.users.find((u) => u.id === booking.physioId) : undefined;
  const patient = booking ? state.users.find((u) => u.id === booking.patientId) : undefined;
  const isDoctor = user?.role === "physio";
  const canStart = useMemo(() => (booking ? isCallWindowOpen(booking, now) : false), [booking, now]);
  const hint = booking ? callWindowHint(booking, now) : "";

  if (!user || !booking) return <p className="card p-6">Booking not found.</p>;
  if (user.id !== booking.patientId && user.id !== booking.physioId) {
    return <p className="card p-6">You do not have access to this booking.</p>;
  }

  const chatHref = isDoctor ? `/doctor/chat/${booking.id}` : `/patient/chat/${booking.id}`;
  const listHref = isDoctor ? "/doctor/appointments" : "/patient/appointments";

  async function startCall() {
    if (!booking || !doctor || !user) return;
    if (!canStart) return;
    setBusy(true);
    setError("");
    try {
      const patientUser = patient ?? {
        ...user,
        id: booking.patientId,
        name: booking.patientName,
        email: booking.patientEmail,
        role: "patient" as const,
        consentHipaa: true,
        consentGdpr: true,
        createdAt: booking.createdAt,
      };
      const { body, href } = await alertPatientCallStarted({
        booking,
        doctor,
        patient: patientUser,
      });
      addNotification({
        userId: booking.patientId,
        title: "Video call started",
        body,
        type: "call",
        href,
        bookingId: booking.id,
      });
      router.push(href);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the video call.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link href={listHref} className="text-sm text-muted no-underline">
        ← Appointments
      </Link>
      <article className="card space-y-3 p-6">
        <p className="text-sm text-muted">
          {formatSlot(booking.scheduledAt)} · {booking.durationMin} min
          {booking.mode ? ` · ${booking.mode === "offline" ? "Clinic visit" : "Online"}` : ""}
        </p>
        <h1 className="text-3xl font-semibold">{isDoctor ? booking.patientName : doctor?.name}</h1>
        <p className="text-muted">{booking.reason}</p>
        {booking.notes && <p>Notes: {booking.notes}</p>}
        <p className="text-sm text-muted">
          {booking.patientPhone} · {booking.patientEmail}
        </p>
        <p className="text-sm text-muted">Booking ID: {booking.id}</p>
        <span className="chip">{booking.status}</span>
        {hint && <p className="text-sm text-muted">{hint}</p>}
        {error && <p className="text-rose">{error}</p>}
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href={chatHref} className="btn btn-ghost">
            Open chat
          </Link>
          {booking.mode !== "offline" && isDoctor && canStart && (
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void startCall()}>
              <Video size={18} /> {busy ? "Starting…" : "Start Video Call"}
            </button>
          )}
          {booking.mode !== "offline" && !isDoctor && canStart && (
            <Link href={consultHref(booking.consultId)} className="btn btn-primary">
              <Video size={18} /> Join Call
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}
