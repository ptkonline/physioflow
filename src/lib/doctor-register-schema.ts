import { z } from "zod";

export const SPECIALIZATIONS = [
  "General physiotherapy",
  "Orthopaedic and sports",
  "Spine and chronic pain",
  "Neurology",
  "Paediatrics",
  "Women’s health",
  "Cardiopulmonary",
  "Geriatrics",
] as const;

export const DEGREES = ["BPT", "MPT", "DPT", "PhD", "Diploma in Physiotherapy", "Other"] as const;

export const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];

const INDIAN_PHONE =
  /^(?:(?:\+91|91)[\s-]?)?[6-9]\d{9}$/;

const requiredImage = z
  .custom<File>((value) => value instanceof File && value.size > 0, {
    message: "A profile photo is required",
  })
  .refine((file) => file.type.startsWith("image/"), { message: "Use a JPG, PNG, or WebP photo" })
  .refine((file) => file.size <= 8 * 1024 * 1024, { message: "Photo must be 8 MB or smaller" });

const requiredFile = z
  .custom<File>((value) => value instanceof File && value.size > 0, {
    message: "This document is required",
  })
  .refine((file) => ACCEPTED_DOC_TYPES.includes(file.type) || file.name.toLowerCase().endsWith(".pdf"), {
    message: "Upload a PDF or image (JPG, PNG, WebP)",
  })
  .refine((file) => file.size <= 8 * 1024 * 1024, { message: "Each file must be 8 MB or smaller" });

export const doctorRegisterSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name"),
    email: z.string().trim().email("Enter a valid email"),
    phone: z
      .string()
      .trim()
      .refine((value) => INDIAN_PHONE.test(value.replace(/[\s-]/g, "").replace(/^0/, "")), {
        message: "Enter a valid Indian mobile number (10 digits, starting 6–9, optional +91)",
      }),
    password: z.string().min(8, "Password must be at least 8 characters"),
    degree: z.enum(DEGREES),
    specialization: z.enum(SPECIALIZATIONS),
    registrationNumber: z.string().trim().min(4, "Registration number is required"),
    experienceYears: z.number().int().min(0, "Enter years of experience").max(55, "Check experience years"),
    clinicName: z.string().trim().min(2, "Enter clinic or practice name"),
    address: z.string().trim().min(8, "Enter the clinic address"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    onlineFee: z.number().positive("Enter a positive online fee").max(100000, "Check the fee amount"),
    offlineFee: z.number().positive("Enter a positive clinic visit fee").max(100000, "Check the fee amount"),
    availabilityDays: z.array(z.number().int().min(0).max(6)).min(1, "Select at least one working day"),
    startHour: z.number().int().min(6).max(21),
    endHour: z.number().int().min(7).max(22),
    profilePhoto: requiredImage,
    degreeCert: requiredFile,
    idProof: requiredFile,
    registrationCard: requiredFile,
  })
  .refine((data) => data.endHour > data.startHour, {
    message: "End time must be after start time",
    path: ["endHour"],
  });

export type DoctorRegisterValues = z.infer<typeof doctorRegisterSchema>;

export const STEP_FIELDS = [
  ["name", "email", "phone", "password"],
  ["degree", "specialization", "registrationNumber", "experienceYears"],
  ["clinicName", "address", "latitude", "longitude", "onlineFee", "offlineFee", "availabilityDays", "startHour", "endHour"],
  ["profilePhoto"],
  ["degreeCert", "idProof", "registrationCard"],
] as const satisfies ReadonlyArray<ReadonlyArray<keyof DoctorRegisterValues>>;
