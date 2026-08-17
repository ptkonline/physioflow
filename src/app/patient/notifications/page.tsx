"use client";

import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";
import { useEffect } from "react";

export default function NotificationsPage() {
  const { user } = useCurrentUser();
  const { state, markNotificationsRead } = useStore();
  const items = state.notifications
    .filter((n) => n.userId === user?.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const userId = user?.id;
  useEffect(() => {
    if (userId) markNotificationsRead(userId);
  }, [userId, markNotificationsRead]);

  async function enablePush() {
    if (!("Notification" in window)) return;
    await Notification.requestPermission();
    if (Notification.permission === "granted") {
      new Notification("PhysioFlow", { body: "Reminders are on for exercises and visits." });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Reminders</h1>
        <button type="button" className="btn btn-primary" onClick={() => void enablePush()}>
          Enable device alerts
        </button>
      </div>
      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id} className="card p-5">
            <p className="text-sm text-muted">{n.type}</p>
            <p className="font-semibold">{n.title}</p>
            <p className="text-muted">{n.body}</p>
            {n.href && (
              <Link href={n.href} className="mt-2 inline-block">
                Open
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
