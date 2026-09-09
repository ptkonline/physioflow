"use client";

import { DoctorAvatar } from "@/components/shared/DoctorAvatar";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { MapDirectionButton } from "@/components/maps/MapDirectionButton";
import { PaymentButton } from "@/components/payment/PaymentButton";
import { SlotCalendar } from "@/components/SlotCalendar";
import { clinicPoint } from "@/lib/geo";
import { doctorPricing, formatInr } from "@/lib/pricing";
import { averageRating } from "@/lib/reviews";
import { useCurrentUser, useStore } from "@/lib/store";
import type { VisitMode } from "@/lib/care-types";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function DoctorProfilePage() {
  const params = useParams<{ id: string }>();
  const { user, profile } = useCurrentUser();
  const { state, createBooking } = useStore();
  const router = useRouter();
  const doctor = state.users.find((u) => u.id === params.id && u.role === "physio");
  const docProfile = state.doctors.find((d) => d.userId === params.id);
  const [slot, setSlot] = useState("");
  const [reason, setReason] = useState(profile?.goal ?? "");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<VisitMode>("online");
  const [error, setError] = useState("");

  if (!doctor || !user || !profile) return <p>Doctor not found.</p>;
  const slotMin = docProfile?.availability?.slotMin ?? 30;
  const stars = averageRating(state.reviews ?? [], doctor.id);
  const pricing = doctorPricing(doctor.id, {
    consultationFee: docProfile?.consultationFee,
    pricing: docProfile?.pricing,
  });
  const pin = clinicPoint(docProfile);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex gap-4">
        <DoctorAvatar name={doctor.name} photoUrl={docProfile?.photoUrl || doctor.profileImageUrl} size={96} />
        <div>
          <p className="chip">{docProfile?.clinicId}</p>
          <h1 className="mt-2 flex flex-wrap items-center gap-2 text-3xl font-semibold">
            {doctor.name} <VerifiedBadge verified={docProfile?.isVerified} />
          </h1>
          <p className="text-muted">{docProfile?.specialty}</p>
          <p className="mt-2">{docProfile?.bio}</p>
          {docProfile?.qualifications && <p className="text-sm text-muted">{docProfile.qualifications}</p>}
          {stars.count > 0 && (
            <p className="mt-1 text-sm text-muted">
              {stars.avg} / 5 · {stars.count} review{stars.count === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </header>
      <MapDirectionButton location={docProfile?.location} clinicName={doctor.name} />
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="card p-4">
          <p className="text-sm text-muted">Online visit</p>
          <p className="text-2xl font-semibold">{formatInr(pricing.onlineFee)}</p>
        </article>
        <article className="card p-4">
          <p className="text-sm text-muted">Clinic visit</p>
          <p className="text-2xl font-semibold">{formatInr(pricing.offlineFee)}</p>
        </article>
      </div>
      {(state.reviews ?? []).filter((r) => r.doctorId === doctor.id).length > 0 && (
        <article className="card space-y-3 p-5">
          <h2 className="font-semibold">Reviews</h2>
          {(state.reviews ?? [])
            .filter((r) => r.doctorId === doctor.id)
            .map((r) => (
              <p key={r.id} className="border-t border-line pt-3 text-sm">
                ★ {r.rating}/5 — {r.comment || "No comment"}
              </p>
            ))}
        </article>
      )}
      <div className="card space-y-4 p-5">
        <h2 className="text-xl font-semibold">Book this doctor</h2>
        <p className="text-muted">
          Booking as {user.name}. The visit is confirmed only after payment succeeds.
        </p>
        <fieldset className="space-y-2">
          <legend className="font-medium">Select mode</legend>
          <div className="flex flex-wrap gap-2">
            <label className={`btn ${mode === "online" ? "btn-primary" : "btn-ghost"}`}>
              <input className="sr-only" type="radio" name="mode" checked={mode === "online"} onChange={() => setMode("online")} />
              Online · {formatInr(pricing.onlineFee)}
            </label>
            <label className={`btn ${mode === "offline" ? "btn-primary" : "btn-ghost"}`}>
              <input className="sr-only" type="radio" name="mode" checked={mode === "offline"} onChange={() => setMode("offline")} />
              Offline · {formatInr(pricing.offlineFee)}
            </label>
          </div>
          {mode === "offline" && pin && <p className="text-sm text-muted">Clinic: {pin.address}</p>}
          {mode === "online" && <p className="text-sm text-muted">You will join a video room after payment.</p>}
        </fieldset>
        <SlotCalendar
          physioId={doctor.id}
          state={state}
          value={slot}
          onChange={setSlot}
          modeLabel={mode === "offline" ? "Clinic" : "Online"}
        />
        <label className="block space-y-1">
          <span>Reason for visit</span>
          <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} required />
        </label>
        <label className="block space-y-1">
          <span>Notes for the doctor</span>
          <textarea className="field min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        {error && <p className="text-rose">{error}</p>}
        {slot && reason.trim() ? (
          <PaymentButton
            profileFee={mode === "offline" ? pricing.offlineFee : pricing.onlineFee}
            draft={{
              createdById: user.id,
              doctorId: doctor.id,
              doctorName: doctor.name,
              doctorEmail: doctor.email,
              patientId: user.id,
              patientName: user.name,
              patientEmail: user.email,
              patientPhone: profile.phone || user.phone || "",
              scheduledAt: slot,
              durationMin: slotMin,
              reason,
              notes,
              mode,
              onlineFee: pricing.onlineFee,
              offlineFee: pricing.offlineFee,
            }}
            onPaid={(paid) => {
              const id = createBooking({
                createdById: user.id,
                physioId: doctor.id,
                patientName: user.name,
                patientEmail: user.email,
                patientPhone: profile.phone || user.phone || "",
                scheduledAt: slot,
                durationMin: slotMin,
                reason,
                notes,
                condition: profile.condition,
                paymentId: paid.paymentId,
                razorpayOrderId: paid.orderId,
                paymentStatus: "success",
                amount: paid.quote.amount,
                currency: paid.quote.currency,
                paymentMethod: paid.paymentMethod,
                paidAt: paid.paidAt,
                consultationFee: paid.quote.consultationFee,
                platformFee: paid.quote.platformFee,
                mode,
                finalPrice: paid.quote.consultationFee,
                clinicAddress: mode === "offline" ? pin?.address : undefined,
              });
              if (!id) {
                setError("Payment is confirmed, but the local booking could not be saved. Check your appointments.");
                return;
              }
              router.push(`/patient/appointments/confirmed?booking=${id}`);
            }}
          />
        ) : (
          <p className="text-sm text-muted">Choose a slot and reason to see the fee and pay.</p>
        )}
      </div>
    </div>
  );
}
