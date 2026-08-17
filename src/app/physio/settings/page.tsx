"use client";

import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";

export default function PhysioSettings() {
  const { user } = useCurrentUser();
  const { state, resetDemo } = useStore();
  if (!user) return null;
  const events = state.audit.filter((a) => a.actorId === user.id).slice(-12).reverse();

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Clinic privacy</h1>
      <article className="card space-y-3 p-5">
        <p>
          This workspace keeps an access log for patient records. A production deployment would add encryption at rest, MFA, and a HIPAA-eligible host.
        </p>
        <Link href="/privacy" className="btn btn-ghost inline-flex">
          Privacy notice
        </Link>
        <button type="button" className="btn btn-ghost" onClick={resetDemo}>
          Reset demo data
        </button>
      </article>
      <article className="card p-5">
        <h2 className="font-semibold">Audit log</h2>
        <ul className="mt-3 space-y-2">
          {events.map((e) => (
            <li key={e.id} className="text-muted">
              {new Date(e.at).toLocaleString()} — {e.action}: {e.detail}
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
