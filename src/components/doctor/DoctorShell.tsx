"use client";

import { AppFrame } from "@/components/shared/AppFrame";
import { useCurrentUser, useStore } from "@/lib/store";
import { BookOpen, Calendar, FileText, Home, LineChart, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export function DoctorShell({ children }: { children: ReactNode }) {
  const t = useTranslations("nav");
  const { user } = useCurrentUser();
  const { state, logout } = useStore();
  if (!user) return null;
  const unread = state.notifications.filter((n) => n.userId === user.id && !n.read).length;
  const nav = [
    { href: "/doctor/dashboard", label: t("home"), icon: Home },
    { href: "/doctor/appointments", label: t("appointments"), icon: Calendar },
    { href: "/doctor/prescriptions", label: t("prescriptions"), icon: FileText },
    { href: "/doctor/patients", label: t("patients"), icon: Users },
    { href: "/doctor/availability", label: t("hours"), icon: LineChart },
    { href: "/doctor/library", label: t("videos"), icon: BookOpen },
  ];

  return (
    <AppFrame
      homeHref="/doctor/dashboard"
      nav={nav}
      notifyHref="/doctor/notifications"
      settingsHref="/doctor/settings"
      unread={unread}
      userName={user.name}
      onSignOut={logout}
    >
      {children}
    </AppFrame>
  );
}
