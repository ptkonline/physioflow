"use client";

export function PainScale({
  value,
  onChange,
  label = "Pain level (0 is none, 10 is worst)",
}: {
  value: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            aria-pressed={value === i}
            className={`grid h-11 w-11 place-items-center rounded-xl border text-base font-semibold ${
              value === i
                ? "border-teal bg-teal text-white"
                : i <= 3
                  ? "border-line bg-sage"
                  : i <= 6
                    ? "border-line bg-sand"
                    : "border-line bg-rose/20"
            }`}
          >
            {i}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
