"use client";

import {
  DEGREES,
  SPECIALIZATIONS,
  STEP_FIELDS,
  doctorRegisterSchema,
  type DoctorRegisterValues,
} from "@/lib/doctor-register-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";

const FileUploadField = dynamic(
  () => import("@/components/FileUploadField").then((mod) => mod.FileUploadField),
  { loading: () => <p className="text-muted">Loading uploader…</p>, ssr: false },
);

const STEPS = [
  { title: "Basic info", blurb: "How patients and the clinic will reach you." },
  { title: "Professional details", blurb: "Qualifications used for verification." },
  { title: "Practice details", blurb: "Where you work and when you are free." },
  { title: "Profile photo", blurb: "Patients see this on Browse Doctors." },
  { title: "Documents", blurb: "PDF or image — all three are required." },
];

const DAYS = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 0, label: "Sun" },
];

export function DoctorRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const form = useForm<DoctorRegisterValues>({
    resolver: zodResolver(doctorRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      degree: "BPT",
      specialization: "General physiotherapy",
      registrationNumber: "",
      experienceYears: 1,
      clinicName: "",
      address: "",
      fees: 800,
      availabilityDays: [1, 2, 3, 4, 5],
      startHour: 9,
      endHour: 17,
    },
    mode: "onTouched",
  });

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;
  const days = watch("availabilityDays") ?? [];

  async function next() {
    const fields = [...STEP_FIELDS[step]] as FieldPath<DoctorRegisterValues>[];
    const ok = await trigger(fields, { shouldFocus: true });
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function onSubmit(values: DoctorRegisterValues) {
    setSubmitError("");
    try {
      const { submitDoctorApplication } = await import("@/lib/submit-doctor-application");
      await submitDoctorApplication(values);
      router.replace("/register/pending");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not submit the application.");
    }
  }

  function toggleDay(id: number) {
    const nextDays = days.includes(id) ? days.filter((d) => d !== id) : [...days, id].sort();
    setValue("availabilityDays", nextDays, { shouldValidate: true, shouldDirty: true });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <ol className="grid grid-cols-2 gap-2 text-center text-xs font-semibold sm:grid-cols-5">
        {STEPS.map((item, index) => (
          <li
            key={item.title}
            className={`rounded-xl px-1 py-2 ${index === step ? "bg-sage text-teal-dark" : "bg-white text-muted"}`}
          >
            {index + 1}. {item.title}
          </li>
        ))}
      </ol>
      <div>
        <h2 className="text-xl font-semibold">{STEPS[step].title}</h2>
        <p className="text-muted">{STEPS[step].blurb}</p>
      </div>

      {step === 0 && (
        <>
          <label className="block space-y-1">
            <span>Full name</span>
            <input className="field" autoComplete="name" {...register("name")} />
            {errors.name && <p className="text-rose">{errors.name.message}</p>}
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1">
              <span>Email</span>
              <input className="field" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-rose">{errors.email.message}</p>}
            </label>
            <label className="block space-y-1">
              <span>Phone (India)</span>
              <input className="field" type="tel" inputMode="tel" placeholder="+91 98765 43210" {...register("phone")} />
              {errors.phone && <p className="text-rose">{errors.phone.message}</p>}
            </label>
          </div>
          <label className="block space-y-1">
            <span>Password</span>
            <input className="field" type="password" autoComplete="new-password" {...register("password")} />
            {errors.password && <p className="text-rose">{errors.password.message}</p>}
          </label>
        </>
      )}

      {step === 1 && (
        <>
          <label className="block space-y-1">
            <span>Degree</span>
            <select className="field" {...register("degree")}>
              {DEGREES.map((degree) => (
                <option key={degree} value={degree}>
                  {degree}
                </option>
              ))}
            </select>
            {errors.degree && <p className="text-rose">{errors.degree.message}</p>}
          </label>
          <label className="block space-y-1">
            <span>Specialization</span>
            <select className="field" {...register("specialization")}>
              {SPECIALIZATIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.specialization && <p className="text-rose">{errors.specialization.message}</p>}
          </label>
          <label className="block space-y-1">
            <span>Council registration number</span>
            <input className="field" {...register("registrationNumber")} />
            {errors.registrationNumber && <p className="text-rose">{errors.registrationNumber.message}</p>}
          </label>
          <label className="block space-y-1">
            <span>Experience (years)</span>
            <input className="field" type="number" min={0} max={55} {...register("experienceYears", { valueAsNumber: true })} />
            {errors.experienceYears && <p className="text-rose">{errors.experienceYears.message}</p>}
          </label>
        </>
      )}

      {step === 2 && (
        <>
          <label className="block space-y-1">
            <span>Clinic name</span>
            <input className="field" {...register("clinicName")} />
            {errors.clinicName && <p className="text-rose">{errors.clinicName.message}</p>}
          </label>
          <label className="block space-y-1">
            <span>Clinic address</span>
            <textarea className="field min-h-24" {...register("address")} />
            {errors.address && <p className="text-rose">{errors.address.message}</p>}
          </label>
          <label className="block space-y-1">
            <span>Consultation fees (₹)</span>
            <input className="field" type="number" min={1} step={50} {...register("fees", { valueAsNumber: true })} />
            {errors.fees && <p className="text-rose">{errors.fees.message}</p>}
          </label>
          <fieldset>
            <legend className="font-medium">Availability</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  className={`btn ${days.includes(day.id) ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => toggleDay(day.id)}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {errors.availabilityDays && <p className="mt-2 text-rose">{errors.availabilityDays.message}</p>}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span>Start hour</span>
              <input className="field" type="number" min={6} max={21} {...register("startHour", { valueAsNumber: true })} />
            </label>
            <label className="block space-y-1">
              <span>End hour</span>
              <input className="field" type="number" min={7} max={22} {...register("endHour", { valueAsNumber: true })} />
              {errors.endHour && <p className="text-rose">{errors.endHour.message}</p>}
            </label>
          </div>
        </>
      )}

      {step === 3 && (
        <FileUploadField
          name="profilePhoto"
          label="Profile photo"
          hint="Clear head-and-shoulders photo. JPG, PNG, or WebP — max 8 MB."
          control={control}
          accept="image/jpeg,image/png,image/webp,image/heic"
          emptyLabel="Drop a photo, or browse"
        />
      )}

      {step === 4 && (
        <div className="space-y-4">
          <FileUploadField
            name="degreeCert"
            label="Degree certificate"
            hint="University degree or equivalent — PDF or photo."
            control={control}
          />
          <FileUploadField
            name="idProof"
            label="ID proof"
            hint="Aadhaar, PAN, or passport."
            control={control}
          />
          <FileUploadField
            name="registrationCard"
            label="Registration card"
            hint="State council / IAP registration card."
            control={control}
          />
        </div>
      )}

      {submitError && <p className="text-rose">{submitError}</p>}

      <div className="flex gap-3">
        {step > 0 && (
          <button type="button" className="btn btn-ghost flex-1" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn-primary flex-1" onClick={() => void next()}>
            Continue
          </button>
        ) : (
          <button className="btn btn-primary flex-1" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit for verification"}
          </button>
        )}
      </div>
    </form>
  );
}
