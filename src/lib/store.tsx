"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { decryptJson, encryptJson } from "./crypto";
import { seedState } from "./seed";
import type {
  AppNotification,
  AppState,
  Condition,
  Consult,
  Exercise,
  PatientProfile,
  Program,
  ProgramItem,
  Role,
} from "./types";

const STORAGE_KEY = "physioflow.v1";

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
      condition?: Condition;
      goal?: string;
    }
  | { type: "updateProfile"; profile: PatientProfile }
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
  | { type: "setConsultStatus"; id: string; status: Consult["status"] }
  | { type: "markNotificationsRead"; userId: string }
  | { type: "addNotification"; notification: Omit<AppNotification, "id" | "createdAt" | "read"> }
  | { type: "addExercise"; exercise: Exercise }
  | { type: "audit"; actorId: string; action: string; detail: string }
  | { type: "deleteAccount"; userId: string };

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "login": {
      const user = state.users.find(
        (u) =>
          u.email.toLowerCase() === action.email.toLowerCase() &&
          u.password === action.password,
      );
      if (!user) return state;
      return {
        ...state,
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
                diagnosis: "Pending clinician review",
                painBaseline: 4,
                dateOfBirth: "",
                assignedPhysioId: "physio-james",
              },
            ]
          : state.profiles;
      return {
        ...state,
        users: [...state.users, user],
        profiles,
        currentUserId: id,
        notifications: [
          ...state.notifications,
          {
            id: uid("n"),
            userId: id,
            title: "Welcome to PhysioFlow",
            body: "Your account is private. You can export or delete your data anytime.",
            type: "system",
            read: false,
            createdAt: new Date().toISOString(),
            href: "/privacy",
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
    case "setConsultStatus":
      return {
        ...state,
        consults: state.consults.map((c) =>
          c.id === action.id ? { ...c, status: action.status } : c,
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
    condition?: Condition;
    goal?: string;
  }) => boolean;
  updateProfile: (profile: PatientProfile) => void;
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = raw.startsWith("{")
            ? (JSON.parse(raw) as AppState)
            : await decryptJson<AppState>(raw);
          if (!cancelled) dispatch({ type: "hydrate", state: parsed });
        }
      } catch {
        /* keep seed */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    encryptJson(state).then((vault) => localStorage.setItem(STORAGE_KEY, vault));
  }, [hydrated, state]);

  const login = useCallback((email: string, password: string) => {
    const found = state.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!found) return false;
    dispatch({ type: "login", email, password });
    return true;
  }, [state.users]);

  const logout = useCallback(() => dispatch({ type: "logout" }), []);
  const register = useCallback((input: Parameters<StoreValue["register"]>[0]) => {
    if (state.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      return false;
    }
    dispatch({ type: "register", ...input });
    return true;
  }, [state.users]);
  const updateProfile = useCallback(
    (profile: PatientProfile) => dispatch({ type: "updateProfile", profile }),
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
      assignProgram,
      completeExercise,
      logPain,
      scheduleConsult,
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
