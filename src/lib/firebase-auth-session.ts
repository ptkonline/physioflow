import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { isFirebaseConfigured } from "./firebase-config";
import { getFirebase } from "./firebase";

let auth: Auth | undefined;

export function getFirebaseAuth() {
  if (!isFirebaseConfigured()) return null;
  if (!auth) auth = getAuth(getFirebase().app);
  return auth;
}

export async function syncFirebaseAuth(email: string, password: string): Promise<User | null> {
  const instance = getFirebaseAuth();
  if (!instance) return null;
  const normalized = email.trim().toLowerCase();
  if (instance.currentUser?.email?.toLowerCase() === normalized) {
    return instance.currentUser;
  }
  if (instance.currentUser) {
    await signOut(instance);
  }
  try {
    return (await signInWithEmailAndPassword(instance, normalized, password)).user;
  } catch {
    try {
      return (await createUserWithEmailAndPassword(instance, normalized, password)).user;
    } catch {
      return null;
    }
  }
}

export async function clearFirebaseAuth() {
  const instance = getFirebaseAuth();
  if (!instance?.currentUser) return;
  await signOut(instance);
}
