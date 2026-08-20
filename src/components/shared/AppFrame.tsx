"use client";

import { Logo } from "@/components/Logo";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";

export type ShellLink = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
};

export function AppFrame({
  homeHref,
  nav,
  notifyHref,
  settingsHref,
  unread,
  userName,
  onSignOut,
  children,
}: {
  homeHref: string;
  nav: ShellLink[];
  notifyHref: string;
  settingsHref: string;
  unread: number;
  userName: string;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const roots = new Set([homeHref]);

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-line bg-elev/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href={homeHref} className="no-underline">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const highlight = roots.has(item.href) ? pathname === item.href : active;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 no-underline ${
                    highlight ? "bg-sage text-teal-dark" : "text-muted hover:bg-white"
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
              <BellIcon />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-rose" />}
            </Link>
            <Link href={settingsHref} className="hidden rounded-xl px-3 py-2 text-sm no-underline md:block">
              {userName}
            </Link>
            <button type="button" className="btn btn-ghost px-3" onClick={onSignOut} aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:pb-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-elev md:hidden" aria-label="Mobile">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
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

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
