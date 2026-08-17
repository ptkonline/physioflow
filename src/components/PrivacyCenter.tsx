"use client";

import { formatDateTime } from "@/lib/format";
import { useCurrentUser, useStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PrivacyCenter() {
  const { user } = useCurrentUser();
  const { state, deleteAccount, resetDemo } = useStore();
  const router = useRouter();
  if (!user) return null;
  const userId = user.id;
  const mineAudit = state.audit.filter((a) => a.actorId === userId).slice(0, 12);

  function download() {
    const bundle = {
      profile: { ...user, password: undefined },
      programs: state.programs.filter((p) => p.patientId === userId || p.physioId === userId),
      completions: state.completions.filter((c) => c.patientId === userId),
      consults: state.consults.filter((c) => c.patientId === userId || c.physioId === userId),
      audit: mineAudit,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "physioflow-data-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Privacy & security</h1>
      <p className="text-muted">
        Health information on this device is encrypted at rest. Access is logged. Production clinics
        still need a BAA, TLS, and a certified telehealth stack.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="card p-5">
          <h2 className="text-xl font-semibold">Consent</h2>
          <p className="mt-2 text-muted">HIPAA and GDPR consent recorded at registration.</p>
          <Link className="mt-3 inline-block text-teal" href="/privacy">
            Read the privacy notice
          </Link>
        </article>
        <article className="card p-5">
          <h2 className="text-xl font-semibold">Your rights</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-ghost" onClick={download}>
              Export my data
            </button>
            <button
              type="button"
              className="btn bg-rose text-white"
              onClick={() => {
                if (confirm("Delete your account and health records on this device?")) {
                  deleteAccount(userId);
                  router.push("/");
                }
              }}
            >
              Delete account
            </button>
            <button type="button" className="btn btn-ghost" onClick={resetDemo}>
              Reset demo
            </button>
          </div>
        </article>
      </div>
      <article className="card p-5">
        <h2 className="text-xl font-semibold">Audit log</h2>
        <ul className="mt-3 divide-y divide-line">
          {mineAudit.map((a) => (
            <li key={a.id} className="flex justify-between gap-4 py-3">
              <span>
                {a.action} — {a.detail}
              </span>
              <span className="shrink-0 text-sm text-muted">{formatDateTime(a.at)}</span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
