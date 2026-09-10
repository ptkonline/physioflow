import type { DailyLog, DoctorLocation, DoctorPricing, ClinicLocation, Prescription, Review, VisitMode } from "./care-types";

export type Role = "patient" | "physio" | "staff";

export type Condition =
  | "knee"
  | "back"
  | "shoulder"
  | "hip"
  | "neck"
  | "ankle";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  passwordHash?: string;
  role: Role;
  phone?: string;
  profileImageUrl?: string;
  locale?: "en" | "hi";
  fcmToken?: string;
  consentHipaa: boolean;
  consentGdpr: boolean;
  createdAt: string;
}

export interface WeekHours {
  days: number[];
  startHour: number;
  endHour: number;
  slotMin: number;
}

export const DEFAULT_HOURS: WeekHours = {
  days: [1, 2, 3, 4, 5],
  startHour: 9,
  endHour: 17,
  slotMin: 30,
};

export interface PatientProfile {
  userId: string;
  condition: Condition;
  goal: string;
  diagnosis: string;
  painBaseline: number;
  dateOfBirth: string;
  assignedPhysioId: string;
  favoriteVideoIds?: string[];
  phone?: string;
  address?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  medicalHistory?: string;
}

export interface DoctorProfile {
  userId: string;
  clinicId: string;
  specialty: string;
  phone: string;
  bio: string;
  qualifications?: string;
  availability: WeekHours;
  photoUrl?: string;
  isVerified?: boolean;
  /** Deactivated doctors are hidden from patient booking but kept for history. */
  active?: boolean;
  location?: DoctorLocation;
  clinicLocation?: ClinicLocation;
  consultationFee?: number;
  pricing?: DoctorPricing;
}

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export type CallStatus = "ringing" | "live" | "ended" | "missed";

export interface Booking {
  id: string;
  consultId: string;
  patientId: string;
  physioId: string;
  createdById: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  scheduledAt: string;
  durationMin: number;
  reason: string;
  notes: string;
  status: "upcoming" | "completed" | "cancelled";
  createdAt: string;
  reminded24h?: boolean;
  reminded1h?: boolean;
  paymentId?: string;
  razorpayOrderId?: string;
  paymentStatus?: PaymentStatus;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  paidAt?: string;
  consultationFee?: number;
  platformFee?: number;
  mode?: VisitMode;
  finalPrice?: number;
  clinicAddress?: string;
  meetingLink?: string;
}

export interface Exercise {
  id: string;
  name: string;
  condition: Condition;
  difficulty: Difficulty;
  durationMin: number;
  description: string;
  instructions: string[];
  precautions: string;
  videoUrl: string;
  thumbnail: string;
}

export interface ProgramItem {
  exerciseId: string;
  sets: number;
  reps: number;
  frequencyPerWeek: number;
  notes: string;
}

export interface Program {
  id: string;
  name: string;
  patientId: string;
  physioId: string;
  items: ProgramItem[];
  startDate: string;
  status: "active" | "completed";
}

export interface CompletionLog {
  id: string;
  patientId: string;
  exerciseId: string;
  programId: string;
  completedAt: string;
  painAfter: number;
  rating: number;
  comment: string;
}

export interface PainLog {
  id: string;
  patientId: string;
  level: number;
  note: string;
  loggedAt: string;
}

export interface Consult {
  id: string;
  patientId: string;
  physioId: string;
  scheduledAt: string;
  durationMin: number;
  status: "upcoming" | "live" | "completed" | "cancelled";
  topic: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "exercise" | "consult" | "feedback" | "system" | "missed_call";
  read: boolean;
  createdAt: string;
  href?: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actorId: string;
  action: string;
  detail: string;
}

export interface AppState {
  users: User[];
  profiles: PatientProfile[];
  exercises: Exercise[];
  programs: Program[];
  completions: CompletionLog[];
  painLogs: PainLog[];
  consults: Consult[];
  bookings: Booking[];
  doctors: DoctorProfile[];
  notifications: AppNotification[];
  audit: AuditEvent[];
  reviews: Review[];
  prescriptions: Prescription[];
  dailyLogs: DailyLog[];
  currentUserId: string | null;
}
