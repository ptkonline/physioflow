export type MessageType = "text" | "image" | "prescription" | "video";

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  fileUrl?: string;
  videoId?: string;
  videoUrl?: string;
  videoTitle?: string;
  type: MessageType;
  createdAt: string;
}

export interface LibraryVideo {
  id: string;
  doctorId: string;
  title: string;
  description: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  createdAt: string;
  updatedAt?: string;
  isPublic: boolean;
  storagePath?: string;
  thumbPath?: string;
}

export interface ChatRoom {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  title: string;
  fileUrl: string;
  fileName: string;
  medicines?: PrescriptionMedicine[];
  clinicalNotes?: string;
  createdAt: string;
}

export interface DoctorLocation {
  address: string;
  city?: string;
  lat: number;
  lng: number;
}

export interface DailyLog {
  id: string;
  patientId: string;
  appointmentId: string;
  doctorId: string;
  date: string;
  didExercises: boolean;
  painLevel: number;
  note: string;
  createdAt: string;
}

export type ReminderWindow = "24h" | "1h";

export interface ReminderDispatch {
  id: string;
  appointmentId: string;
  patientId: string;
  window: ReminderWindow;
  channel: "push" | "sms" | "in_app";
  sentAt: string;
}
