"use client";

import { OfflineSync } from "@/components/OfflineSync";
import { StoreProvider } from "@/lib/store";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <OfflineSync />
      {children}
    </StoreProvider>
  );
}
