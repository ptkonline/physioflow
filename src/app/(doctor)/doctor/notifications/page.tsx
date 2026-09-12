"use client";

import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";
import { useEffect } from "react";

export default function PhysioNotifications() {
  const { user } = useCurrentUser();
  const { state, markNotificationsRead } = useStore();
  const items = state.notifications
    .filter((n) => n.userId === user?.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const userId = user?.id;
  useEffect(() => {
    if (userId) markNotificationsRead(userId);
  }, [markNotificationsRead, userId]);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Inbox</h1>
      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id} className="card p-5">
            <p className="font-semibold">{n.title}</p>
            <p className="text-muted">{n.body}</p>
            {n.href && (
              <Link href={n.href} className="btn btn-primary mt-3 inline-flex">
                {n.type === "missed_call" ? "Open visit" : "Open"}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
