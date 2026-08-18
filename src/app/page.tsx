import { Logo } from "@/components/Logo";
import { ShieldCheck, StretchHorizontal, Video, LineChart } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: StretchHorizontal,
    title: "Guided programs",
    text: "Clinicians assign clear, video-backed exercises matched to your condition.",
  },
  {
    icon: Video,
    title: "Video visits",
    text: "Join a private consultation from home with large, simple controls.",
  },
  {
    icon: LineChart,
    title: "Progress you can see",
    text: "Track completions, pain levels, and how each exercise felt.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    text: "HIPAA- and GDPR-minded consent, audit logs, and data export or deletion.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo className="text-xl" />
        <div className="flex gap-2">
          <Link href="/login" className="btn btn-ghost">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-primary">
            Get started
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="grid items-center gap-10 py-10 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="chip">For patients and physiotherapists</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-5xl">
              Recover at home with a plan you can follow.
            </h1>
            <p className="max-w-lg text-lg text-muted">
              PhysioFlow is a calm space for exercise programs, video visits, and recovery tracking — designed to be easy to read and easy to tap.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-primary">
                Create a free account
              </Link>
              <Link href="/login" className="btn btn-ghost">
                Try the demo
              </Link>
            </div>
          </div>
          <div className="card overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.pexels.com/photos/8436586/pexels-photo-8436586.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Person stretching during a physiotherapy session"
              className="h-80 w-full object-cover"
            />
            <div className="grid grid-cols-3 gap-3 p-5 text-center">
              <div>
                <p className="text-2xl font-semibold">12</p>
                <p className="text-sm text-muted">Video exercises</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">2</p>
                <p className="text-sm text-muted">Demo roles</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">0–10</p>
                <p className="text-sm text-muted">Pain scale</p>
              </div>
            </div>
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <article key={f.title} className="card p-5">
              <f.icon className="text-teal" />
              <h2 className="mt-3 text-lg font-semibold">{f.title}</h2>
              <p className="mt-1 text-muted">{f.text}</p>
            </article>
          ))}
        </section>
        <p className="mt-10 text-center text-sm text-muted">
          Demo: <strong>priya@demo.physio</strong> (front desk),{" "}
          <strong>james@demo.physio</strong> / <strong>aisha@demo.physio</strong> (doctors),{" "}
          <strong>maya@demo.physio</strong> (patient). Password <strong>demo123</strong>.
        </p>
      </main>
    </div>
  );
}
