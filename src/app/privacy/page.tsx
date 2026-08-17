import { Logo } from "@/components/Logo";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="no-underline">
        <Logo />
      </Link>
      <article className="card mt-6 space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Privacy and data protection</h1>
        <p>
          PhysioFlow is a demonstration product. In a production clinic it would run with a HIPAA-eligible host, signed BAAs, and a GDPR legal basis for processing.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Health data stays in your browser for this demo, encrypted at rest with AES-GCM, not on a shared server.</li>
          <li>Video visits use your camera locally and are not recorded.</li>
          <li>Access is logged in an audit trail visible in Settings.</li>
          <li>You can export a JSON copy of your records or delete your account.</li>
          <li>Passwords are stored only in this demo dataset — a live system would hash them server-side.</li>
        </ul>
        <Link href="/login" className="btn btn-primary inline-flex">
          Back to sign in
        </Link>
      </article>
    </div>
  );
}
