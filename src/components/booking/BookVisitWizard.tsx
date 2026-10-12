"use client";

import { PaymentButton } from "@/components/payment/PaymentButton";
import { SlotCalendar } from "@/components/SlotCalendar";
import { StepScreen } from "@/components/flow/StepScreen";
import type { PhysioService, VisitMode } from "@/lib/care-types";
import { clinicPoint } from "@/lib/geo";
import { formatInr } from "@/lib/pricing";
import { bookableServices, serviceVisitMode } from "@/lib/services";
import { useStore } from "@/lib/store";
import type { DoctorProfile, PatientProfile, User } from "@/lib/types";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function serviceTitle(service: PhysioService, t: (key: string) => string) {
  if (service.id === "visit-online") return t("onlineVisit");
  if (service.id === "visit-clinic") return t("clinicVisit");
  return service.name;
}

export function BookVisitWizard({
  doctorUser,
  doctor,
  patient,
  profile,
}: {
  doctorUser: User;
  doctor: DoctorProfile;
  patient: User;
  profile: PatientProfile;
}) {
  const t = useTranslations("booking");
  const tc = useTranslations("common");
  const { state, createBooking } = useStore();
  const router = useRouter();
  const services = useMemo(() => bookableServices(doctor), [doctor]);
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [slot, setSlot] = useState("");
  const [reason, setReason] = useState(profile.goal ?? "");
  const [error, setError] = useState("");

  const service = services.find((item) => item.id === serviceId) ?? services[0];
  const mode: VisitMode = service ? serviceVisitMode(service, service.mode === "offline" ? "offline" : "online") : "online";
  const [preferredMode, setPreferredMode] = useState<VisitMode>(mode);
  const visitMode: VisitMode = service ? serviceVisitMode(service, preferredMode) : "online";
  const pin = clinicPoint(doctor);

  if (!service) {
    return <p className="text-muted">{t("noServices")}</p>;
  }

  function modeCopy(value: VisitMode) {
    return value === "offline" ? t("clinic") : t("online");
  }

  return (
    <section className="card space-y-4 p-4 sm:p-5">
      {step === 1 && (
        <StepScreen
          step={1}
          total={3}
          title={t("pickService")}
          hint={t("pickServiceHint")}
          primaryLabel={tc("continue")}
          primaryDisabled={!serviceId}
          onPrimary={() => setStep(2)}
        >
          <ul className="space-y-3">
            {services.map((item) => {
              const selected = item.id === service.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`service-card ${selected ? "on" : ""}`}
                    onClick={() => setServiceId(item.id)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{serviceTitle(item, t)}</span>
                      <span className="mt-0.5 block text-sm text-muted">
                        {item.durationMin} {t("min")} · {item.mode === "both" ? t("onlineOrClinic") : modeCopy(item.mode)}
                      </span>
                      {item.description && <span className="mt-1 block text-sm text-muted">{item.description}</span>}
                    </span>
                    <span className="price-tag">{formatInr(item.price)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </StepScreen>
      )}

      {step === 2 && (
        <StepScreen
          step={2}
          total={3}
          title={t("pickSlot")}
          hint={`${serviceTitle(service, t)} · ${formatInr(service.price)}`}
          backLabel={t("back")}
          onBack={() => setStep(1)}
          primaryLabel={tc("continue")}
          primaryDisabled={!slot}
          onPrimary={() => setStep(3)}
        >
          {service.mode === "both" && (
            <div className="grid grid-cols-2 gap-2">
              {(["online", "offline"] as VisitMode[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`btn ${preferredMode === value ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setPreferredMode(value)}
                >
                  {modeCopy(value)}
                </button>
              ))}
            </div>
          )}
          <SlotCalendar physioId={doctor.userId} state={state} value={slot} onChange={setSlot} modeLabel={modeCopy(visitMode)} />
        </StepScreen>
      )}

      {step === 3 && (
        <StepScreen
          step={3}
          total={3}
          title={t("confirm")}
          hint={t("confirmHint")}
          backLabel={t("back")}
          onBack={() => setStep(2)}
        >
          <div className="rounded-2xl bg-sage/60 p-4">
            <p className="font-semibold">{serviceTitle(service, t)}</p>
            <p className="text-sm text-muted">
              {doctorUser.name} · {modeCopy(visitMode)}
            </p>
            <p className="mt-2 text-2xl font-semibold">{formatInr(service.price)}</p>
          </div>
          <label className="block space-y-1">
            <span>{t("reason")}</span>
            <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("reasonPlaceholder")} />
          </label>
          {visitMode === "offline" && pin && <p className="text-sm text-muted">{pin.address}</p>}
          {error && <p className="text-rose">{error}</p>}
          {slot && (
            <PaymentButton
              profileFee={service.price}
              draft={{
                createdById: patient.id,
                doctorId: doctor.userId,
                doctorName: doctorUser.name,
                doctorEmail: doctorUser.email,
                patientId: patient.id,
                patientName: patient.name,
                patientEmail: patient.email,
                patientPhone: profile.phone || patient.phone || "",
                scheduledAt: slot,
                durationMin: service.durationMin,
                reason: reason.trim() || serviceTitle(service, t),
                notes: "",
                mode: visitMode,
                onlineFee: service.mode === "offline" ? undefined : service.price,
                offlineFee: service.mode === "online" ? undefined : service.price,
                serviceId: service.id,
                serviceName: serviceTitle(service, t),
                servicePrice: service.price,
              }}
              onPaid={(paid) => {
                const id = createBooking({
                  createdById: patient.id,
                  physioId: doctor.userId,
                  patientName: patient.name,
                  patientEmail: patient.email,
                  patientPhone: profile.phone || patient.phone || "",
                  scheduledAt: slot,
                  durationMin: service.durationMin,
                  reason: reason.trim() || serviceTitle(service, t),
                  notes: "",
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
                  mode: visitMode,
                  finalPrice: paid.quote.consultationFee,
                  clinicAddress: visitMode === "offline" ? pin?.address : undefined,
                  serviceId: service.id,
                  serviceName: serviceTitle(service, t),
                });
                if (!id) {
                  setError(t("saveFailed"));
                  return;
                }
                router.push(`/patient/appointments/confirmed?booking=${id}`);
              }}
            />
          )}
        </StepScreen>
      )}
    </section>
  );
}
