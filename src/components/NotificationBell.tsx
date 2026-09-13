"use client";

import { ensurePushToken } from "@/lib/notifications";
import { useCurrentUser, useStore } from "@/lib/store";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export function NotificationBell() {
  const { user } = useCurrentUser();
  const { state } = useStore();
  const unread = user ? state.notifications.filter((n) => n.userId === user.id && !n.read).length : 0;
  const href = user?.role === "physio" ? "/doctor/notifications" : "/patient/notifications";

  useEffect(() => {
    if (!user) return;
    void ensurePushToken(user.id, user.email).catch(() => undefined);
  }, [user]);

  if (!user) return null;

  return (
    <Link
      href={href}
      className="relative grid h-11 w-11 place-items-center rounded-xl border border-line bg-white no-underline"
      aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
    >
      <Bell size={18} />
      {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-rose" />}
    </Link>
  );
}
