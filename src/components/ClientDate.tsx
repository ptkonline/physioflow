"use client";

import { formatDate, formatDateTime, formatTime } from "@/lib/format";
import { useEffect, useState } from "react";

type Kind = "datetime" | "date" | "time";

function format(iso: string, kind: Kind) {
  if (kind === "date") return formatDate(iso);
  if (kind === "time") return formatTime(iso);
  return formatDateTime(iso);
}

/** Locale/timezone labels only after mount so SSR HTML matches the first client render. */
export function ClientDate({
  iso,
  kind = "datetime",
  className,
}: {
  iso: string;
  kind?: Kind;
  className?: string;
}) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(format(iso, kind));
  }, [iso, kind]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {label}
    </time>
  );
}
