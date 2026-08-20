"use client";

import { AppFrame } from "@/components/shared/AppFrame";
import { useCurrentUser, useStore } from "@/lib/store";
import { BookOpen, Calendar, ClipboardCheck, FileText, Home, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export function PatientShell({ children }: { children: ReactNode }) {
  const t = useTranslations("nav");
  const { user } = useCurrentUser();
  const { state, logout } = useStore();
  if (!user) return null;
  const unread = state.notifications.filter((n) => n.userId === user.id && !n.read).length;
  const nav = [
    { href: "/patient/dashboard", label: t("home"), icon: Home },
    { href: "/patient/book-appointment", label: t("doctors"), icon: Users },
    { href: "/patient/appointments", label: t("appointments"), icon: Calendar },
    { href: "/patient/prescriptions", label: t("prescriptions"), icon: FileText },
    { href: "/patient/progress", label: t("today"), icon: ClipboardCheck },
    { href: "/patient/library", label: t("library"), icon: BookOpen },
  ];

  return (
    <AppFrame
      homeHref="/patient/dashboard"
      nav={nav}
      notifyHref="/patient/notifications"
      settingsHref="/patient/settings"
      unread={unread}
      userName={user.name}
      onSignOut={logout}
    >
      {children}
    </AppFrame>
  );
}
