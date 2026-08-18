"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { decryptJson } from "./crypto";
import { seedState } from "./seed";
import type {
  AppNotification,
  AppState,
  Booking,
  Condition,
  Consult,
  DoctorProfile,
  Exercise,
  PatientProfile,
  Program,
  ProgramItem,
  Role,
} from "./types";
import { DEFAULT_HOURS } from "./types";

const STORAGE_KEY = "physioflow.v4";
const LEGACY_KEY = "physioflow.v3";
const SESSION_KEY = "physioflow.session";

function readVaultSync(): AppState | null {
  try {
    const sessionId = localStorage.getItem(SESSION_KEY);
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (raw?.startsWith("{")) {
      const parsed = JSON.parse(raw) as AppState;
      if (sessionId) parsed.currentUserId = sessionId;
      return parsed;
    }
    if (sessionId) return { ...seedState, currentUserId: sessionId };
  } catch {
    /* keep seed */
  }
  return null;
}

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "login"; email: string; password: string }
  | { type: "logout" }
  | {
      type: "register";
      name: string;
      email: string;
      password: string;
      role: Role;
      phone?: string;
      condition?: Condition;
      goal?: string;
      dateOfBirth?: string;
      address?: string;
      emergencyName?: string;
      emergencyPhone?: string;
      medicalHistory?: string;
      specialty?: string;
      clinicId?: string;
      bio?: string;
      qualifications?: string;
    }
  | { type: "updateProfile"; profile: PatientProfile }
  | { type: "updateDoctor"; doctor: DoctorProfile }
  | { type: "assignProgram"; program: Program }
  | {
      type: "completeExercise";
      patientId: string;
      exerciseId: string;
      programId: string;
      painAfter: number;
      rating: number;
      comment: string;
    }
  | { type: "logPain"; patientId: string; level: number; note: string }
  | { type: "scheduleConsult"; consult: Omit<Consult, "id" | "status"> }
  | {
      type: "createBooking";
      createdById: string;
      physioId: string;
      patientName: string;
      patientEmail: string;
      patientPhone: string;
      scheduledAt: string;
      durationMin: number;
      reason: string;
      notes: string;
      condition?: Condition;
    }
  | {
      type: "addDoctor";
      name: string;
      email: string;
      password: string;
      clinicId: string;
      specialty: string;
      phone: string;
      bio: string;
    }
  | { type: "setConsultStatus"; id: string; status: Consult["status"] }
  | { type: "markNotificationsRead"; userId: string }
  | { type: "addNotification"; notification: Omit<AppNotification, "id" | "createdAt" | "read"> }
  | { type: "addExercise"; exercise: Exercise }
  | { type: "audit"; actorId: string; action: string; detail: string }
  | { type: "deleteAccount"; userId: string };

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeState(incoming: AppState): AppState {
  const doctors = (incoming.doctors ?? seedState.doctors).map((d) => ({
    ...d,
    availability: d.availability ?? DEFAULT_HOURS,
  }));
  const users = [...(incoming.users ?? [])];
  for (const demo of seedState.users) {
    if (!users.some((u) => u.id === demo.id || u.email.toLowerCase() === demo.email.toLowerCase())) {
      users.push(demo);
    }
  }
  const profiles = [...(incoming.profiles ?? [])];
  for (const demo of seedState.profiles) {
    if (!profiles.some((p) => p.userId === demo.userId)) profiles.push(demo);
  }
  const current =
    incoming.currentUserId && users.some((u) => u.id === incoming.currentUserId)
      ? incoming.currentUserId
      : null;
  return {
    ...seedState,
    ...incoming,
    users,
    profiles,
    doctors,
    bookings: incoming.bookings ?? seedState.bookings,
    consults: incoming.consults ?? seedState.consults,
    currentUserId: current,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return normalizeState(action.state);
    case "login": {
      let users = state.users;
      let profiles = state.profiles;
      let user = users.find(
        (u) =>
          u.email.toLowerCase() === action.email.toLowerCase() &&
          u.password === action.password,
      );
      if (!user) {
        user = seedState.users.find(
          (u) =>
            u.email.toLowerCase() === action.email.toLowerCase() &&
            u.password === action.password,
        );
        if (user) {
          users = [...users, user];
          const extra = seedState.profiles.filter((p) => p.userId === user.id);
          profiles = [...profiles, ...extra.filter((p) => !profiles.some((x) => x.userId === p.userId))];
        }
      }
      if (!user) return state;
      return {
        ...state,
        users,
        profiles,
        currentUserId: user.id,
        audit: [
          ...state.audit,
          {
            id: uid("audit"),
            at: new Date().toISOString(),
            actorId: user.id,
            action: "login",
            detail: "Signed in with email and password",
          },
        ],
      };
    }
    case "logout":
      return { ...state, currentUserId: null };
    case "register": {
      if (state.users.some((u) => u.email.toLowerCase() === action.email.toLowerCase())) {
        return state;
      }
      const id = uid(action.role);
      const user = {
        id,
        name: action.name,
        email: action.email,
        password: action.password,
        role: action.role,
        phone: action.phone,
        consentHipaa: true,
        consentGdpr: true,
        createdAt: new Date().toISOString(),
      };
      const profiles =
        action.role === "patient"
          ? [
              ...state.profiles,
              {
                userId: id,
                condition: action.condition ?? "back",
                goal: action.goal ?? "Improve daily mobility",
                diagnosis: action.medicalHistory || "Self-registered",
                painBaseline: 4,
                dateOfBirth: action.dateOfBirth ?? "",
                assignedPhysioId: "",
                phone: action.phone,
                address: action.address,
                emergencyName: action.emergencyName,
                emergencyPhone: action.emergencyPhone,
                medicalHistory: action.medicalHistory,
              },
            ]
          : state.profiles;
      const doctors =
        action.role === "physio"
          ? [
              ...state.doctors,
              {
                userId: id,
                clinicId:
                  action.clinicId?.trim() ||
                  `DOC-${String(1000 + state.doctors.length + 1).padStart(4, "0")}`,
                specialty: action.specialty ?? "General physiotherapy",
                phone: action.phone ?? "",
                bio: action.bio ?? "",
                qualifications: action.qualifications,
                availability: DEFAULT_HOURS,
              },
            ]
          : state.doctors;
      return {
        ...state,
        users: [...state.users, user],
        profiles,
        doctors,
        currentUserId: id,
        notifications: [
          ...state.notifications,
          {
            id: uid("n"),
            userId: id,
            title: "Your profile is ready",
            body:
              action.role === "physio"
                ? "Patients can now see you and book open slots."
                : "Browse doctors and book a visit — no reception desk needed.",
            type: "system",
            read: false,
            createdAt: new Date().toISOString(),
            href: action.role === "physio" ? "/physio" : "/patient/doctors",
          },
        ],
      };
    }
    case "updateProfile":
      return {
        ...state,
        profiles: state.profiles.map((p) =>
          p.userId === action.profile.userId ? action.profile : p,
        ),
      };
    case "updateDoctor":
      return {
        ...state,
        doctors: state.doctors.map((d) =>
          d.userId === action.doctor.userId ? action.doctor : d,
        ),
      };
    case "assignProgram": {
      const programs = [
        ...state.programs.map((p) =>
          p.patientId === action.program.patientId && p.status === "active"
            ? { ...p, status: "completed" as const }
            : p,
        ),
        action.program,
      ];
      return {
        ...state,
        programs,
        notifications: [
          ...state.notifications,
          {
            id: uid("n"),
            userId: action.program.patientId,
            title: "New exercise program",
            body: action.program.name,
            type: "exercise",
            read: false,
            createdAt: new Date().toISOString(),
            href: "/patient/program",
          },
        ],
      };
    }
    case "completeExercise": {
      const log = {
        id: uid("log"),
        patientId: action.patientId,
        exerciseId: action.exerciseId,
        programId: action.programId,
        completedAt: new Date().toISOString(),
        painAfter: action.painAfter,
        rating: action.rating,
        comment: action.comment,
      };
      const physioId =
        state.programs.find((p) => p.id === action.programId)?.physioId ??
        state.profiles.find((p) => p.userId === action.patientId)?.assignedPhysioId;
      return {
        ...state,
        completions: [...state.completions, log],
        painLogs: [
          ...state.painLogs,
          {
            id: uid("pain"),
            patientId: action.patientId,
            level: action.painAfter,
            note: "Logged after exercise",
            loggedAt: new Date().toISOString(),
          },
        ],
        notifications: physioId
          ? [
              ...state.notifications,
              {
                id: uid("n"),
                userId: physioId,
                title: "Exercise feedback received",
                body: `${state.users.find((u) => u.id === action.patientId)?.name ?? "Patient"} rated ${action.rating}/5`,
                type: "feedback",
                read: false,
                createdAt: new Date().toISOString(),
              },
            ]
          : state.notifications,
      };
    }
    case "logPain":
      return {
        ...state,
        painLogs: [
          ...state.painLogs,
          {
            id: uid("pain"),
            patientId: action.patientId,
            level: action.level,
            note: action.note,
            loggedAt: new Date().toISOString(),
          },
        ],
      };
    case "scheduleConsult": {
      const consult: Consult = {
        ...action.consult,
        id: uid("call"),
        status: "upcoming",
      };
      return {
        ...state,
        consults: [...state.consults, consult],
        notifications: [
          ...state.notifications,
          {
            id: uid("n"),
            userId: consult.patientId,
            title: "Video consultation booked",
            body: consult.topic,
            type: "consult",
            read: false,
            createdAt: new Date().toISOString(),
            href: `/consult/${consult.id}`,
          },
          {
            id: uid("n"),
            userId: consult.physioId,
            title: "New consultation on your calendar",
            body: consult.topic,
            type: "consult",
            read: false,
            createdAt: new Date().toISOString(),
            href: `/consult/${consult.id}`,
          },
        ],
      };
    }
    case "createBooking": {
      const email = action.patientEmail.trim().toLowerCase();
      const doctor = state.users.find((u) => u.id === action.physioId && u.role === "physio");
      if (!doctor) return state;
      const existing = state.users.find((u) => u.email.toLowerCase() === email);
      if (existing && existing.role !== "patient") return state;

      let patientId = existing?.id;
      let users = state.users;
      let profiles = state.profiles;
      if (!patientId) {
        patientId = uid("patient");
        users = [
          ...users,
          {
            id: patientId,
            name: action.patientName.trim(),
            email,
            password: "demo123",
            role: "patient",
            phone: action.patientPhone,
            consentHipaa: true,
            consentGdpr: true,
            createdAt: new Date().toISOString(),
          },
        ];
        profiles = [
          ...profiles,
          {
            userId: patientId,
            condition: action.condition ?? "back",
            goal: "Improve daily mobility",
            diagnosis: action.reason,
            painBaseline: 4,
            dateOfBirth: "",
            assignedPhysioId: action.physioId,
            phone: action.patientPhone,
          },
        ];
      } else {
        profiles = profiles.map((p) =>
          p.userId === patientId ? { ...p, assignedPhysioId: action.physioId, phone: action.patientPhone } : p,
        );
        users = users.map((u) => (u.id === patientId ? { ...u, phone: action.patientPhone, name: action.patientName.trim() } : u));
      }

      const consultId = uid("call");
      const bookingId = uid("book");
      const consult: Consult = {
        id: consultId,
        patientId,
        physioId: action.physioId,
        scheduledAt: action.scheduledAt,
        durationMin: action.durationMin,
        status: "upcoming",
        topic: action.reason,
      };
      const booking: Booking = {
        id: bookingId,
        consultId,
        patientId,
        physioId: action.physioId,
        createdById: action.createdById,
        patientName: action.patientName.trim(),
        patientEmail: email,
        patientPhone: action.patientPhone,
        scheduledAt: action.scheduledAt,
        durationMin: action.durationMin,
        reason: action.reason,
        notes: action.notes,
        status: "upcoming",
        createdAt: new Date().toISOString(),
      };
      const clinicId = state.doctors.find((d) => d.userId === action.physioId)?.clinicId ?? action.physioId;
      return {
        ...state,
        users,
        profiles,
        consults: [...state.consults, consult],
        bookings: [...(state.bookings ?? []), booking],
        notifications: [
          ...state.notifications,
          {
            id: uid("n"),
            userId: action.physioId,
            title: "New booking on your list",
            body: `${action.patientName} · ${action.reason} · ${clinicId}`,
            type: "consult",
            read: false,
            createdAt: new Date().toISOString(),
            href: "/physio/bookings",
          },
          {
            id: uid("n"),
            userId: patientId,
            title: "Your appointment is booked",
            body: `${doctor.name} · ${action.reason}`,
            type: "consult",
            read: false,
            createdAt: new Date().toISOString(),
            href: `/consult/${consultId}`,
          },
        ],
        audit: [
          ...state.audit,
          {
            id: uid("audit"),
            at: new Date().toISOString(),
            actorId: action.createdById,
            action: "create_booking",
            detail: `Booked ${action.patientName} with ${doctor.name} (${clinicId})`,
          },
        ],
      };
    }
    case "addDoctor": {
      if (state.users.some((u) => u.email.toLowerCase() === action.email.toLowerCase())) {
        return state;
      }
      const userId = uid("physio");
      const clinicId =
        action.clinicId.trim() ||
        `DOC-${String(1000 + state.doctors.length + 1).padStart(4, "0")}`;
      const user = {
        id: userId,
        name: action.name.trim(),
        email: action.email.trim().toLowerCase(),
        password: action.password,
        role: "physio" as const,
        phone: action.phone,
        consentHipaa: true,
        consentGdpr: true,
        createdAt: new Date().toISOString(),
      };
      const doctor: DoctorProfile = {
        userId,
        clinicId,
        specialty: action.specialty,
        phone: action.phone,
        bio: action.bio,
        availability: DEFAULT_HOURS,
      };
      return {
        ...state,
        users: [...state.users, user],
        doctors: [...(state.doctors ?? []), doctor],
        notifications: [
          ...state.notifications,
          {
            id: uid("n"),
            userId,
            title: "Your clinic ID is ready",
            body: `Sign in with ${user.email}. Bookings for ${clinicId} appear here automatically.`,
            type: "system",
            read: false,
            createdAt: new Date().toISOString(),
            href: "/physio/bookings",
          },
        ],
      };
    }
    case "setConsultStatus":
      return {
        ...state,
        consults: state.consults.map((c) =>
          c.id === action.id ? { ...c, status: action.status } : c,
        ),
        bookings: (state.bookings ?? []).map((b) =>
          b.consultId === action.id
            ? {
                ...b,
                status: action.status === "live" ? "upcoming" : action.status,
              }
            : b,
        ),
      };
    case "markNotificationsRead": {
      const unread = state.notifications.some((n) => n.userId === action.userId && !n.read);
      if (!unread) return state;
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.userId === action.userId ? { ...n, read: true } : n,
        ),
      };
    }
    case "addNotification":
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            ...action.notification,
            id: uid("n"),
            read: false,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    case "addExercise":
      return { ...state, exercises: [...state.exercises, action.exercise] };
    case "audit":
      return {
        ...state,
        audit: [
          ...state.audit,
          {
            id: uid("audit"),
            at: new Date().toISOString(),
            actorId: action.actorId,
            action: action.action,
            detail: action.detail,
          },
        ],
      };
    case "deleteAccount": {
      const id = action.userId;
      return {
        ...state,
        currentUserId: state.currentUserId === id ? null : state.currentUserId,
        users: state.users.filter((u) => u.id !== id),
        profiles: state.profiles.filter((p) => p.userId !== id),
        programs: state.programs.filter((p) => p.patientId !== id && p.physioId !== id),
        completions: state.completions.filter((c) => c.patientId !== id),
        painLogs: state.painLogs.filter((p) => p.patientId !== id),
        consults: state.consults.filter((c) => c.patientId !== id && c.physioId !== id),
        bookings: (state.bookings ?? []).filter((b) => b.patientId !== id && b.physioId !== id && b.createdById !== id),
        doctors: (state.doctors ?? []).filter((d) => d.userId !== id),
        notifications: state.notifications.filter((n) => n.userId !== id),
      };
    }
    default:
      return state;
  }
}

interface StoreValue {
  state: AppState;
  hydrated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  register: (input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    phone?: string;
    condition?: Condition;
    goal?: string;
    dateOfBirth?: string;
    address?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    medicalHistory?: string;
    specialty?: string;
    clinicId?: string;
    bio?: string;
    qualifications?: string;
  }) => boolean;
  updateProfile: (profile: PatientProfile) => void;
  updateDoctor: (doctor: DoctorProfile) => void;
  assignProgram: (input: {
    name: string;
    patientId: string;
    physioId: string;
    items: ProgramItem[];
  }) => void;
  completeExercise: (input: {
    patientId: string;
    exerciseId: string;
    programId: string;
    painAfter: number;
    rating: number;
    comment: string;
  }) => void;
  logPain: (patientId: string, level: number, note: string) => void;
  scheduleConsult: (consult: Omit<Consult, "id" | "status">) => void;
  createBooking: (input: {
    createdById: string;
    physioId: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    scheduledAt: string;
    durationMin: number;
    reason: string;
    notes: string;
    condition?: Condition;
  }) => boolean;
  addDoctor: (input: {
    name: string;
    email: string;
    password: string;
    clinicId: string;
    specialty: string;
    phone: string;
    bio: string;
  }) => boolean;
  setConsultStatus: (id: string, status: Consult["status"]) => void;
  markNotificationsRead: (userId: string) => void;
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  addExercise: (exercise: Exercise) => void;
  audit: (actorId: string, action: string, detail: string) => void;
  deleteAccount: (userId: string) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, seedState);
  const [hydrated, setHydrated] = useState(false);
  const sessionLock = useRef<string | null>(null);

  useLayoutEffect(() => {
    const cached = readVaultSync();
    if (cached && !sessionLock.current) dispatch({ type: "hydrate", state: cached });
    setHydrated(true);

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy || legacy.startsWith("{") || localStorage.getItem(STORAGE_KEY)) return;
    let cancelled = false;
    void decryptJson<AppState>(legacy).then((parsed) => {
      const sessionId = localStorage.getItem(SESSION_KEY);
      if (sessionId) parsed.currentUserId = sessionId;
      if (!cancelled && !sessionLock.current) dispatch({ type: "hydrate", state: parsed });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota */
    }
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (state.currentUserId) localStorage.setItem(SESSION_KEY, state.currentUserId);
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, [hydrated, state.currentUserId]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if ((event.key !== STORAGE_KEY && event.key !== LEGACY_KEY) || !event.newValue) return;
      const raw = event.newValue;
      void (async () => {
        try {
          const parsed = raw.startsWith("{")
            ? (JSON.parse(raw) as AppState)
            : await decryptJson<AppState>(raw);
          dispatch({ type: "hydrate", state: parsed });
        } catch {
          /* ignore malformed peer writes */
        }
      })();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const found =
      state.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      ) ??
      seedState.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      );
    if (!found) return false;
    sessionLock.current = found.id;
    try {
      localStorage.setItem(SESSION_KEY, found.id);
    } catch {
      /* ignore */
    }
    dispatch({ type: "login", email, password });
    return true;
  }, [state.users]);

  const logout = useCallback(() => {
    sessionLock.current = null;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    dispatch({ type: "logout" });
  }, []);
  const register = useCallback((input: Parameters<StoreValue["register"]>[0]) => {
    if (state.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      return false;
    }
    dispatch({ type: "register", ...input });
    sessionLock.current = "pending";
    return true;
  }, [state.users]);
  const updateProfile = useCallback(
    (profile: PatientProfile) => dispatch({ type: "updateProfile", profile }),
    [],
  );
  const updateDoctor = useCallback(
    (doctor: DoctorProfile) => dispatch({ type: "updateDoctor", doctor }),
    [],
  );
  const assignProgram = useCallback(
    (input: { name: string; patientId: string; physioId: string; items: ProgramItem[] }) =>
      dispatch({
        type: "assignProgram",
        program: {
          ...input,
          id: uid("prog"),
          startDate: new Date().toISOString(),
          status: "active",
        },
      }),
    [],
  );
  const completeExercise = useCallback(
    (input: {
      patientId: string;
      exerciseId: string;
      programId: string;
      painAfter: number;
      rating: number;
      comment: string;
    }) => dispatch({ type: "completeExercise", ...input }),
    [],
  );
  const logPain = useCallback(
    (patientId: string, level: number, note: string) =>
      dispatch({ type: "logPain", patientId, level, note }),
    [],
  );
  const scheduleConsult = useCallback(
    (consult: Omit<Consult, "id" | "status">) => dispatch({ type: "scheduleConsult", consult }),
    [],
  );
  const createBooking = useCallback(
    (input: Parameters<StoreValue["createBooking"]>[0]) => {
      const doctor = state.users.find((u) => u.id === input.physioId && u.role === "physio");
      const clash = state.users.find(
        (u) => u.email.toLowerCase() === input.patientEmail.trim().toLowerCase() && u.role !== "patient",
      );
      if (!doctor || clash) return false;
      dispatch({ type: "createBooking", ...input });
      return true;
    },
    [state.users],
  );
  const addDoctor = useCallback((input: Parameters<StoreValue["addDoctor"]>[0]) => {
    if (state.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      return false;
    }
    dispatch({ type: "addDoctor", ...input });
    return true;
  }, [state.users]);
  const setConsultStatus = useCallback(
    (id: string, status: Consult["status"]) => dispatch({ type: "setConsultStatus", id, status }),
    [],
  );
  const markNotificationsRead = useCallback(
    (userId: string) => dispatch({ type: "markNotificationsRead", userId }),
    [],
  );
  const addNotification = useCallback(
    (notification: Omit<AppNotification, "id" | "createdAt" | "read">) =>
      dispatch({ type: "addNotification", notification }),
    [],
  );
  const addExercise = useCallback(
    (exercise: Exercise) => dispatch({ type: "addExercise", exercise }),
    [],
  );
  const audit = useCallback(
    (actorId: string, action: string, detail: string) =>
      dispatch({ type: "audit", actorId, action, detail }),
    [],
  );
  const deleteAccount = useCallback(
    (userId: string) => dispatch({ type: "deleteAccount", userId }),
    [],
  );
  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
    dispatch({ type: "hydrate", state: { ...seedState, currentUserId: null } });
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      hydrated,
      login,
      logout,
      register,
      updateProfile,
      updateDoctor,
      assignProgram,
      completeExercise,
      logPain,
      scheduleConsult,
      createBooking,
      addDoctor,
      setConsultStatus,
      markNotificationsRead,
      addNotification,
      addExercise,
      audit,
      deleteAccount,
      resetDemo,
    }),
    [
      addExercise,
      addNotification,
      assignProgram,
      audit,
      completeExercise,
      createBooking,
      addDoctor,
      deleteAccount,
      hydrated,
      login,
      logPain,
      logout,
      markNotificationsRead,
      register,
      resetDemo,
      scheduleConsult,
      setConsultStatus,
      state,
      updateDoctor,
      updateProfile,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useCurrentUser() {
  const { state } = useStore();
  const user = state.users.find((u) => u.id === state.currentUserId) ?? null;
  const profile = user ? state.profiles.find((p) => p.userId === user.id) ?? null : null;
  return { user, profile };
}
