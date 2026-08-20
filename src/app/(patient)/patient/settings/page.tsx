"use client";

import { CONDITIONS, GOALS } from "@/lib/seed";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { useCurrentUser, useStore } from "@/lib/store";
import type { Condition } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PatientSettings() {
  const { user, profile } = useCurrentUser();
  const { state, updateProfile, deleteAccount, resetDemo } = useStore();
  const router = useRouter();
  if (!user || !profile) return null;
  const userId = user.id;

  function exportData() {
    const bundle = {
      user,
      profile,
      programs: state.programs.filter((p) => p.patientId === userId),
      completions: state.completions.filter((c) => c.patientId === userId),
      painLogs: state.painLogs.filter((p) => p.patientId === userId),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "physioflow-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Settings & privacy</h1>
      <article className="card space-y-3 p-5">
        <h2 className="font-semibold">Language</h2>
        <p className="text-muted">Buttons and labels follow this preference on this device.</p>
        <LocaleSwitcher />
      </article>
      <form
        className="card space-y-3 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          updateProfile({
            ...profile,
            condition: form.get("condition") as Condition,
            goal: String(form.get("goal")),
          });
        }}
      >
        <h2 className="font-semibold">Condition and goal</h2>
        <select name="condition" className="field" defaultValue={profile.condition}>
          {CONDITIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select name="goal" className="field" defaultValue={profile.goal}>
          {GOALS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit">
          Save
        </button>
      </form>
      <article className="card space-y-3 p-5">
        <h2 className="font-semibold">Your data rights</h2>
        <p className="text-muted">Export a copy or delete this demo account. See the privacy notice for how a clinic would handle PHI.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost" onClick={exportData}>
            Export JSON
          </button>
          <Link href="/privacy" className="btn btn-ghost">
            Privacy notice
          </Link>
          <button
            type="button"
            className="btn bg-rose text-white"
            onClick={() => {
              deleteAccount(userId);
              router.replace("/");
            }}
          >
            Delete account
          </button>
          <button type="button" className="btn btn-ghost" onClick={resetDemo}>
            Reset demo data
          </button>
        </div>
      </article>
    </div>
  );
}
