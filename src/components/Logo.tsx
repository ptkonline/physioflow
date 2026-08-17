export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 20c2-6 4-9 8-12M7 10c3 .5 6 3 9 8"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="16.5" cy="7.5" r="1.6" fill="currentColor" />
        </svg>
      </span>
      PhysioFlow
    </span>
  );
}
