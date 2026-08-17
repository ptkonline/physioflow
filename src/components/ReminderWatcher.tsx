"use client";

import { useStore } from "@/lib/store";
import { useEffect } from "react";

export function ReminderWatcher() {
  const { state, addNotification } = useStore();

  useEffect(() => {
    const userId = state.currentUserId;
    if (!userId) return;

    const key = `physioflow.reminded.${userId}.${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const user = state.users.find((u) => u.id === userId);
    if (user?.role === "patient") {
      addNotification({
        userId,
        title: "Exercise reminder",
        body: "A short session today keeps your recovery on track.",
        type: "exercise",
        href: "/patient/program",
      });
    }

    async function maybeNotify() {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") {
        new Notification("PhysioFlow reminder", {
          body: "Time for your physiotherapy session.",
        });
      }
    }
    void maybeNotify();
  }, [addNotification, state.currentUserId]);

  return null;
}
