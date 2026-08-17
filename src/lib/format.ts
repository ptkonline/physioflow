export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function todayKey(iso = new Date().toISOString()) {
  return iso.slice(0, 10);
}

export function painLabel(n: number) {
  if (n <= 2) return "Mild";
  if (n <= 5) return "Moderate";
  if (n <= 7) return "Strong";
  return "Severe";
}
