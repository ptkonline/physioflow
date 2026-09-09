"use client";

import { VideoRoom } from "@/components/VideoRoom";
import { formatDateTime } from "@/lib/format";
import { useCurrentUser, useStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export function VideoCall({ consultId }: { consultId: string }) {
  const { state, setConsultStatus, addNotification } = useStore();
  const { user } = useCurrentUser();
  const router = useRouter();

  const consult = state.consults.find((c) => c.id === consultId);
  const booking = (state.bookings ?? []).find((b) => b.consultId === consultId);
  const patient = consult ? state.users.find((u) => u.id === consult.patientId) : null;
  const doctor = consult ? state.users.find((u) => u.id === consult.physioId) : null;
  const other = user?.role === "physio" ? patient : doctor;

  if (!consult || !user || !patient || !doctor) return <p>Visit not found.</p>;
  if (user.id !== consult.patientId && user.id !== consult.physioId) {
    return <p>You are not part of this visit.</p>;
  }

  const appointmentId = booking?.id ?? consult.id;
  const isCaller = user.role === "physio";

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-semibold">{consult.topic}</h1>
        <p className="text-muted">
          {other?.name} · {formatDateTime(consult.scheduledAt)} · {consult.durationMin} min
        </p>
      </header>
      <VideoRoom
        room={{
          roomId: consult.id,
          appointmentId,
          patientId: consult.patientId,
          doctorId: consult.physioId,
          patientEmail: patient.email,
          doctorEmail: doctor.email,
        }}
        localUserId={user.id}
        localName={user.name}
        remoteName={other?.name ?? "the other participant"}
        isCaller={isCaller}
        onJoin={() => setConsultStatus(consult.id, "live")}
        onMissed={() => {
          const otherId = user.id === consult.patientId ? consult.physioId : consult.patientId;
          addNotification({
            userId: otherId,
            title: "Missed call",
            body: `${user.name} tried to reach you for ${consult.topic}.`,
            type: "consult",
            href: `/consult/${consult.id}`,
          });
        }}
        onLeave={() => {
          setConsultStatus(consult.id, "completed");
          router.push(user.role === "physio" ? "/doctor/consults" : "/patient/consults");
        }}
      />
    </div>
  );
}

export default VideoCall;
