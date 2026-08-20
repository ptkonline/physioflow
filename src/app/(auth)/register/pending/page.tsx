import { Logo } from "@/components/Logo";
import Link from "next/link";

export default function RegisterPendingPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Link href="/" className="no-underline">
        <Logo className="text-xl" />
      </Link>
      <div className="card mt-6 space-y-3 p-6">
        <h1 className="text-2xl font-semibold">Application received</h1>
        <p className="text-muted">
          Your profile is in <strong>pending</strong> verification. You can sign in as a doctor only after documents
          are approved. Without Firebase keys this is saved in this browser; add{" "}
          <code>NEXT_PUBLIC_FIREBASE_*</code> in <code>.env.local</code> to send it to Firestore.
        </p>
        <Link href="/doctor/onboarding" className="btn btn-ghost inline-flex no-underline">
          Doctor onboarding
        </Link>
        <Link href="/login" className="btn btn-primary inline-flex no-underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
