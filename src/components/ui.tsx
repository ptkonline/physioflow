import type { ReactNode } from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-700 text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4v16M8 8c2 2 6 2 8 0M8 16c2-2 6-2 8 0" strokeLinecap="round" />
        </svg>
      </span>
      PhysioFlow
    </span>
  );
}

export function Button({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  disabled,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
}) {
  const styles = {
    primary:
      "bg-teal-700 text-white hover:bg-teal-800 focus-visible:outline-teal-700",
    secondary:
      "bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50 focus-visible:outline-teal-700",
    ghost: "text-teal-800 hover:bg-teal-50 focus-visible:outline-teal-700",
    danger: "bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-700",
  }[variant];
  const cls = `inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-medium transition disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${styles} ${className}`;
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/80 ${className}`}>
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-base font-medium text-stone-800">{label}</span>
      {children}
      {hint ? <span className="block text-sm text-stone-500">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border-0 bg-stone-50 px-4 py-3 text-base text-stone-900 ring-1 ring-stone-300 outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-teal-700";
