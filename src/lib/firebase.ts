import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";
import { EMULATOR_PROJECT_ID, isFirebaseConfigured, emulatorEnabled } from "./firebase-config";

function emulatorHost() {
  return process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST?.trim() || "127.0.0.1";
}

function emulatorPort(envVar: string | undefined, fallback: number) {
  const parsed = Number.parseInt(envVar ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function config() {
  if (emulatorEnabled()) {
    // Fixed demo values — the emulator does not validate them, but the SDK
    // requires non-empty fields to initialize.
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || EMULATOR_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${EMULATOR_PROJECT_ID}.appspot.com`,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:demophysioflow",
    };
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let persistenceWarned = false;

export function getFirebase() {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* keys in .env.local.");
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(config());
    const emulator = emulatorEnabled();
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch (err) {
      // Already initialized (HMR) or unsupported environment — fall back.
      if (!persistenceWarned && process.env.NODE_ENV === "development") {
        persistenceWarned = true;
        console.debug("[firebase] persistent cache unavailable", err);
      }
      db = getFirestore(app);
    }
    storage = getStorage(app);
    if (emulator) {
      const host = emulatorHost();
      try {
        connectFirestoreEmulator(db, host, emulatorPort(process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_PORT, 8080));
      } catch {
        /* already connected (HMR) */
      }
      try {
        connectStorageEmulator(storage, host, emulatorPort(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT, 9199));
      } catch {
        /* already connected (HMR) */
      }
    }
  }
  return { app, db: db!, storage: storage! };
}
