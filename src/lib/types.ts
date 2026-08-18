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
  password: string;
  role: Role;
  phone?: string;
  consentHipaa: boolean;
  consentGdpr: boolean;
  createdAt: string;
}

export interface PatientProfile {
  userId: string;
  condition: Condition;
  goal: string;
  diagnosis: string;
  painBaseline: number;
  dateOfBirth: string;
  assignedPhysioId: string;
  phone?: string;
}

export interface DoctorProfile {
  userId: string;
  clinicId: string;
  specialty: string;
  phone: string;
  bio: string;
}

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
  type: "exercise" | "consult" | "feedback" | "system";
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
  currentUserId: string | null;
}
