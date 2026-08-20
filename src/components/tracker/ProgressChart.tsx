"use client";

import type { DailyLog } from "@/lib/care-types";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ProgressChart({ logs }: { logs: DailyLog[] }) {
  const t = useTranslations("progress");
  const data = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((l) => ({
      date: l.date.slice(5),
      pain: l.painLevel,
      done: l.didExercises ? 1 : 0,
    }));

  if (data.length < 2) {
    return <p className="text-muted">{t("empty")}</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <article className="card p-5">
        <h2 className="mb-3 font-semibold">{t("painOverTime")}</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="pain" stroke="#0f6e62" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
      <article className="card p-5">
        <h2 className="mb-3 font-semibold">{t("adherence")}</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 1]} ticks={[0, 1]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="done" fill="#0f6e62" name={t("did")} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </div>
  );
}
