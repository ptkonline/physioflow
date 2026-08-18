"use client";

import { Logo } from "@/components/Logo";
import { homePath } from "@/lib/paths";
import { useCurrentUser, useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import {
  Bell,
  BookOpen,
  Calendar,
  Home,
  LineChart,
  LogOut,
  StretchHorizontal,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const patientNav = [
  { href: "/patient", label: "Home", icon: Home },
  { href: "/patient/doctors", label: "Doctors", icon: Users },
  { href: "/patient/appointments", label: "Appointments", icon: Calendar },
  { href: "/patient/program", label: "Program", icon: StretchHorizontal },
  { href: "/patient/library", label: "Library", icon: BookOpen },
];

const physioNav = [
  { href: "/physio", label: "Home", icon: Home },
  { href: "/physio/bookings", label: "Appointments", icon: Calendar },
  { href: "/physio/patients", label: "Patients", icon: Users },
  { href: "/physio/availability", label: "Hours", icon: LineChart },
  { href: "/physio/library", label: "Library", icon: BookOpen },
];

function navFor(role: Role) {
  return role === "physio" ? physioNav : patientNav;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser();
  const { state, logout } = useStore();
  const pathname = usePathname();
  if (!user) return null;

  const nav = navFor(user.role);
  const unread = state.notifications.filter((n) => n.userId === user.id && !n.read).length;
  const notifyHref = user.role === "physio" ? "/physio/notifications" : "/patient/notifications";
  const settingsHref = user.role === "physio" ? "/physio/settings" : "/patient/settings";

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-line bg-elev/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href={homePath(user.role)} className="no-underline">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 no-underline ${
                    active && item.href !== "/patient" && item.href !== "/physio"
                      ? "bg-sage text-teal-dark"
                      : pathname === item.href
                        ? "bg-sage text-teal-dark"
                        : "text-muted hover:bg-white"
                  }`}
                >
                  <Icon size={18} /> {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href={notifyHref}
              className="relative grid h-11 w-11 place-items-center rounded-xl border border-line bg-white no-underline"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-rose" />
              )}
            </Link>
            <Link href={settingsHref} className="hidden rounded-xl px-3 py-2 text-sm no-underline md:block">
              {user.name}
            </Link>
            <button type="button" className="btn btn-ghost px-3" onClick={logout} aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-10">{children}</main>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-elev md:hidden"
        aria-label="Mobile"
      >
        <ul className="grid grid-cols-5">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
                  className={`flex flex-col items-center gap-1 py-3 text-xs no-underline ${
                    active ? "text-teal" : "text-muted"
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
