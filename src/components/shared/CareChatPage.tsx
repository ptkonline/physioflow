"use client";

import { ChatWindow } from "@/components/shared/ChatWindow";
import { DoctorAvatar } from "@/components/shared/DoctorAvatar";
import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";
import { useParams } from "next/navigation";

export function CareChatPage({ portal }: { portal: "patient" | "doctor" }) {
  const params = useParams<{ bookingId: string }>();
  const { user } = useCurrentUser();
  const { state } = useStore();
  const booking = (state.bookings ?? []).find((b) => b.id === params.bookingId);

  if (!user) return null;
  if (!booking) return <p className="card p-6">Appointment not found.</p>;
  const allowed = user.id === booking.patientId || user.id === booking.physioId;
  if (!allowed) return <p className="card p-6">You do not have access to this chat.</p>;

  const back = portal === "patient" ? "/patient/appointments" : "/doctor/appointments";
  const other =
    user.id === booking.patientId
      ? state.users.find((u) => u.id === booking.physioId)
      : state.users.find((u) => u.id === booking.patientId);
  const otherName = other?.name ?? (user.id === booking.patientId ? "your doctor" : booking.patientName);
  const doctorProfile = state.doctors.find((d) => d.userId === booking.physioId);

  return (
    <div className="space-y-4">
      <div>
        <Link href={back} className="text-sm text-muted no-underline">
          ← Appointments
        </Link>
        <div className="mt-2 flex items-center gap-3">
          {user.id === booking.patientId && (
            <DoctorAvatar
              name={otherName}
              photoUrl={doctorProfile?.photoUrl || other?.profileImageUrl}
              size={48}
            />
          )}
          <div>
            <h1 className="text-3xl font-semibold">Chat with {otherName}</h1>
            <p className="text-muted">{booking.reason}</p>
          </div>
        </div>
      </div>
      <ChatWindow
        appointmentId={booking.id}
        patientId={booking.patientId}
        doctorId={booking.physioId}
        currentUserId={user.id}
        currentIsPatient={user.role === "patient"}
      />
    </div>
  );
}
