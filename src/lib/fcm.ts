import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { isFirebaseConfigured } from "./firebase-config";
import { getFirebase } from "./firebase";

export async function registerPushToken(userId: string, email: string) {
  if (!isFirebaseConfigured() || typeof window === "undefined") return null;
  const vapid = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  if (!vapid) return null;
  if (!(await isSupported())) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  const { app, db } = getFirebase();
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: vapid });
  if (!token) return null;
  await setDoc(
    doc(db, "users", userId),
    {
      email: email.trim().toLowerCase(),
      fcmToken: token,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return token;
}
