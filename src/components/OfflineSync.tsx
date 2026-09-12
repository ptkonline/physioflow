"use client";

import { ensureChatRoom, sendChatMessage } from "@/lib/chat";
import { registerPushToken } from "@/lib/fcm";
import { deleteOfflineItem, readOfflineQueue } from "@/lib/offline-idb";
import { loadRemoteBookings } from "@/lib/persist-booking";
import { useCurrentUser, useStore } from "@/lib/store";
import { useEffect, useState } from "react";

export function OfflineSync() {
  const { user } = useCurrentUser();
  const { hydrated, completeExercise, upsertDailyLog, mergeBookings } = useStore();
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!hydrated || !user) return;
    void registerPushToken(user.id, user.email).catch(() => undefined);
    void loadRemoteBookings(user.email)
      .then((rows) => {
        if (rows.length) mergeBookings(rows);
      })
      .catch(() => undefined);
  }, [hydrated, mergeBookings, user]);

  useEffect(() => {
    if (!hydrated) return;

    async function flush() {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setNote("You're offline. Chat and check-ins will sync when you reconnect.");
        return;
      }
      const queue = await readOfflineQueue();
      if (!queue.length) {
        setNote("");
        return;
      }
      setNote(`Syncing ${queue.length} queued item${queue.length === 1 ? "" : "s"}…`);
      for (const item of queue) {
        try {
          if (item.kind === "chat") {
            await ensureChatRoom({
              appointmentId: item.payload.appointmentId,
              patientId: item.payload.patientId,
              doctorId: item.payload.doctorId,
              patientEmail: item.payload.patientEmail,
              doctorEmail: item.payload.doctorEmail,
            });
            await sendChatMessage({
              appointmentId: item.payload.appointmentId,
              senderId: item.payload.senderId,
              text: item.payload.text,
            });
          } else if (item.kind === "exercise") {
            completeExercise(item.payload);
          } else {
            upsertDailyLog(item.payload);
          }
          await deleteOfflineItem(item.id);
        } catch {
          break;
        }
      }
      setNote("");
    }

    void flush();
    const onOnline = () => void flush();
    const onOffline = () => setNote("You're offline. Chat and check-ins will sync when you reconnect.");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [completeExercise, hydrated, upsertDailyLog]);

  if (!note) return null;
  return <p className="bg-sage px-4 py-2 text-center text-sm text-teal-dark">{note}</p>;
}
