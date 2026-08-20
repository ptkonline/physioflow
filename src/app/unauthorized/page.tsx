import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md space-y-4 p-6 text-center">
        <p className="chip mx-auto">Access denied</p>
        <h1 className="text-2xl font-semibold">You cannot open the admin console</h1>
        <p className="text-muted">
          This area is limited to a single configured administrator. Patients and doctors cannot enter it, even with a
          guessed URL.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn btn-ghost">
            Home
          </Link>
          <Link href="/login" className="btn btn-primary">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
