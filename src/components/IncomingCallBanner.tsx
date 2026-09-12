"use client";

import { consultHref } from "@/lib/call-window";
import { subscribeCallMeta } from "@/lib/webrtc-signaling";
import { useCurrentUser, useStore } from "@/lib/store";
import { Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function IncomingCallBanner() {
  const { user } = useCurrentUser();
  const { state } = useStore();
  const [active, setActive] = useState<{ consultId: string; bookingId: string; doctorName: string } | null>(null);

  const watchKey = (state.bookings ?? [])
    .filter((b) => user && b.patientId === user.id && b.status === "upcoming" && b.mode !== "offline")
    .map((b) => b.consultId)
    .sort()
    .join(",");

  useEffect(() => {
    if (!user || user.role !== "patient" || !watchKey) return;
    const rows = (state.bookings ?? []).filter((b) => watchKey.split(",").includes(b.consultId));
    const unsubs = rows.map((booking) => {
      const doctor = state.users.find((u) => u.id === booking.physioId);
      return subscribeCallMeta(booking.consultId, (meta) => {
        if (meta.status === "ringing") {
          setActive({
            consultId: booking.consultId,
            bookingId: booking.id,
            doctorName: doctor?.name ?? "Your doctor",
          });
        }
        if (meta.status === "live" || meta.status === "ended" || meta.status === "missed") {
          setActive((cur) => (cur?.consultId === booking.consultId ? null : cur));
        }
      });
    });
    return () => unsubs.forEach((fn) => fn());
  }, [state.bookings, state.users, user, watchKey]);

  if (!active) return null;

  return (
    <div className="bg-teal px-4 py-3 text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="font-medium">
          Dr. {active.doctorName} has started your video call. Tap to join.
        </p>
        <Link href={consultHref(active.consultId)} className="btn bg-white text-teal no-underline">
          <Video size={16} /> Join Call
        </Link>
      </div>
    </div>
  );
}
