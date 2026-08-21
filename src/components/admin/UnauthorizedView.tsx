"use client";

import { issueAdminSession } from "@/lib/admin-actions";
import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function UnauthorizedView({ envReady }: { envReady: boolean }) {
  const { hydrated } = useStore();
  const { user } = useCurrentUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    void issueAdminSession({ email: user.email, userId: user.id }).then((result) => {
      if (cancelled) return;
      if (result.admin) {
        router.replace("/admin/dashboard");
        return;
      }
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md space-y-4 p-6 text-center">
        <p className="chip mx-auto">Access denied</p>
        <h1 className="text-2xl font-semibold">You cannot open the admin console</h1>
        {!envReady ? (
          <p className="text-muted">
            Local admin keys are missing. Add <code>ADMIN_EMAIL</code>, <code>ADMIN_UID</code>, and{" "}
            <code>ADMIN_SESSION_SECRET</code> in <code>.env.local</code>, then restart <code>npm run dev</code>. Demo
            admin is <strong>james@demo.physio</strong> / <strong>physio-james</strong>.
          </p>
        ) : checking ? (
          <p className="text-muted">Checking admin access…</p>
        ) : (
          <p className="text-muted">
            Sign in as the configured admin (<strong>james@demo.physio</strong> / demo123), then open{" "}
            <code>/admin/dashboard</code>. Patients and other doctors are blocked.
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn btn-ghost">
            Home
          </Link>
          <Link href="/login?next=%2Fadmin%2Fdashboard" className="btn btn-primary">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
