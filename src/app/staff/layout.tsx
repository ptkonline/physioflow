"use client";

import { AuthGate } from "@/components/AuthGate";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { CalendarDays, LogOut, Stethoscope } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/staff/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/staff/doctors", label: "Doctors", icon: Stethoscope },
];

export default function StaffLayout({ children }: { children: ReactNode }) {
  const { logout } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  function signOut() {
    logout();
    router.replace("/login");
  }

  return (
    <AuthGate role="staff">
      <div className="min-h-screen bg-bg">
        <header className="sticky top-0 z-20 border-b border-line bg-elev/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/staff/bookings" className="no-underline">
              <Logo />
            </Link>
            <p className="hidden text-sm text-muted md:block">Front desk · staff</p>
            <button type="button" className="btn btn-ghost px-3" onClick={signOut} aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </div>
          <nav className="mx-auto flex max-w-5xl gap-1 px-2 pb-2">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium no-underline ${
                    active ? "bg-teal text-white" : "text-muted hover:bg-sage"
                  }`}
                >
                  <Icon size={16} /> {label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      </div>
    </AuthGate>
  );
}
