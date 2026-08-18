"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StaffRetired() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);
  return <p className="p-8 text-muted">This clinic has no front desk. Redirecting to sign in…</p>;
}
