"use client";

import Link from "next/link";

export function UnauthorizedView({ envReady }: { envReady: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md space-y-4 p-6 text-center">
        <p className="chip mx-auto">Access denied</p>
        <h1 className="text-2xl font-semibold">Admin sign-in is separate</h1>
        {!envReady ? (
          <p className="text-muted">
            Add <code>ADMIN_EMAIL</code>, <code>ADMIN_UID</code>, and <code>ADMIN_SESSION_SECRET</code> on the UAT
            deployment, then open the admin sign-in page.
          </p>
        ) : (
          <p className="text-muted">Use the admin email and password. Patient and doctor accounts stay on the main sign-in page.</p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn btn-ghost">
            Home
          </Link>
          <Link href="/admin/login" className="btn btn-primary">
            Admin sign-in
          </Link>
        </div>
      </div>
    </div>
  );
}
