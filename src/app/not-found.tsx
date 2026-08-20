import { Logo } from "@/components/Logo";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
      <Logo className="text-xl" />
      <h1 className="mt-8 text-3xl font-semibold">This page is missing</h1>
      <p className="mt-2 text-muted">
        Use the home page or sign in. If you opened a Vercel link, wait until the deployment is Ready, then open the
        exact Production URL (it ends with <code>.vercel.app</code>).
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/" className="btn btn-primary">
          Home
        </Link>
        <Link href="/login" className="btn btn-ghost">
          Sign in
        </Link>
      </div>
    </div>
  );
}
