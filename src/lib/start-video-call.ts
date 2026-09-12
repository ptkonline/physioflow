import { ensureChatRoom, sendChatMessage } from "./chat";
import { consultHref } from "./call-window";
import { notifyFcm } from "./notifications";
import { ensureCallRoom, markCallStatus } from "./webrtc-signaling";
import type { Booking, User } from "./types";

export async function alertPatientCallStarted(input: {
  booking: Booking;
  doctor: User;
  patient: User;
}) {
  const { booking, doctor, patient } = input;
  const href = consultHref(booking.consultId);
  const body = `Dr. ${doctor.name} has started your video call. Tap to join.`;

  await ensureChatRoom({
    appointmentId: booking.id,
    patientId: booking.patientId,
    doctorId: booking.physioId,
    patientEmail: patient.email || booking.patientEmail,
    doctorEmail: doctor.email,
    localEmail: doctor.email,
  });

  await sendChatMessage({
    appointmentId: booking.id,
    senderId: doctor.id,
    text: body,
    type: "call",
    href,
  });

  await ensureCallRoom({
    roomId: booking.consultId,
    appointmentId: booking.id,
    patientId: booking.patientId,
    doctorId: booking.physioId,
    patientEmail: patient.email || booking.patientEmail,
    doctorEmail: doctor.email,
    localEmail: doctor.email,
  });
  await markCallStatus(booking.consultId, "ringing", doctor.id, { appointmentId: booking.id });

  await notifyFcm({
    userId: patient.id,
    title: "Video call started",
    body,
    href,
  });

  return { href, body };
}
