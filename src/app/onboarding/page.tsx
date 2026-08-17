"use client";

import { CONDITIONS, GOALS } from "@/lib/seed";
import { useCurrentUser, useStore } from "@/lib/store";
import type { Condition } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OnboardingPage() {
  const { user, profile } = useCurrentUser();
  const { hydrated, updateProfile } = useStore();
  const router = useRouter();
  const [condition, setCondition] = useState<Condition>(profile?.condition ?? "knee");
  const [goal, setGoal] = useState(profile?.goal ?? GOALS[0]);

  if (!hydrated) return <p className="p-8">Loading…</p>;
  if (!user) {
    router.replace("/login");
    return null;
  }
  if (user.role !== "patient" || !profile) {
    router.replace("/physio");
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Tell us what you are working on</h1>
      <p className="mt-2 text-lg text-muted">
        This helps your physiotherapist choose the right exercises. You can change it later.
      </p>
      <form
        className="mt-8 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          updateProfile({ ...profile, condition, goal });
          router.push("/patient");
        }}
      >
        <fieldset>
          <legend className="text-lg font-medium">Main condition</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {CONDITIONS.map((c) => (
              <label
                key={c.id}
                className={`cursor-pointer rounded-2xl bg-elev p-4 ${
                  condition === c.id ? "ring-2 ring-teal" : "ring-1 ring-line"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name="condition"
                  checked={condition === c.id}
                  onChange={() => setCondition(c.id)}
                />
                <span className="block font-medium">{c.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-lg font-medium">Primary goal</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setGoal(g)}
                className={`rounded-full px-4 py-2 ring-1 ${
                  goal === g ? "bg-teal text-white ring-teal" : "bg-elev ring-line"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="btn btn-primary">
          Save and go to my dashboard
        </button>
      </form>
    </div>
  );
}
