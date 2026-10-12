import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, memoryLocalCache, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { isFirebaseConfigured } from "./firebase-config";

function config() {
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
    try {
      // Memory cache only. Multi-tab IndexedDB persistence can leave the first
      // profile write pending forever, which keeps doctor signup on "Please wait…".
      db = initializeFirestore(app, {
        localCache: memoryLocalCache(),
        experimentalAutoDetectLongPolling: true,
      });
    } catch (err) {
      if (!persistenceWarned && process.env.NODE_ENV === "development") {
        persistenceWarned = true;
        console.debug("[firebase] memory cache unavailable", err);
      }
      db = getFirestore(app);
    }
    storage = getStorage(app);
    storage.maxUploadRetryTime = 12_000;
    storage.maxOperationRetryTime = 12_000;
  }
  return { app, db: db!, storage: storage! };
}
