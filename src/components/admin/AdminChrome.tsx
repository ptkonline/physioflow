"use client";

import { Logo } from "@/components/Logo";
import { revokeAdminSession } from "@/lib/admin-actions";
import { useStore } from "@/lib/store";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function AdminChrome({ email, children }: { email: string; children: ReactNode }) {
  const { logout } = useStore();
  const router = useRouter();

  async function signOut() {
    await revokeAdminSession();
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-line bg-elev/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin/dashboard" className="no-underline">
            <Logo />
          </Link>
          <p className="hidden text-sm text-muted md:block">Admin console · {email}</p>
          <button type="button" className="btn btn-ghost px-3" onClick={() => void signOut()} aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
