const KEY = "physioflow.offline.queue";

export type LsQueueItem = {
  id: string;
  kind: "chat" | "exercise" | "log";
  payload: Record<string, unknown>;
  createdAt: string;
};

export function readLsQueue(): LsQueueItem[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as LsQueueItem[];
  } catch {
    return [];
  }
}

export function pushLsQueue(item: LsQueueItem) {
  const next = [...readLsQueue(), item];
  localStorage.setItem(KEY, JSON.stringify(next.slice(-80)));
}

export function writeLsQueue(items: LsQueueItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}
