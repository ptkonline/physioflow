"use client";

import { useEffect, useState } from "react";

export function NetworkStatus({ className = "" }: { className?: string }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${className}`} title={online ? "Online" : "Offline"}>
      <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-rose"}`} />
      {online ? "Online" : "Offline"}
    </span>
  );
}
