import { assertPortalRole } from "@/lib/assert-portal-role";
import type { ReactNode } from "react";

export default async function DoctorGroupLayout({ children }: { children: ReactNode }) {
  await assertPortalRole("doctor", "/doctor/dashboard");
  return children;
}
