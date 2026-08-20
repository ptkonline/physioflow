"use client";

import { issueAdminSession, revokeAdminSession } from "@/lib/admin-actions";
import { useCurrentUser, useStore } from "@/lib/store";
import { useEffect } from "react";

export function AdminSessionSync() {
  const { hydrated } = useStore();
  const { user } = useCurrentUser();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      void revokeAdminSession();
      return;
    }
    void issueAdminSession({ email: user.email, userId: user.id });
  }, [hydrated, user]);

  return null;
}
