"use client";

import { AdminSessionSync } from "@/components/admin/AdminSessionSync";
import { StoreProvider } from "@/lib/store";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <AdminSessionSync />
      {children}
    </StoreProvider>
  );
}
