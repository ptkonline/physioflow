import { assertPortalRole } from "@/lib/assert-portal-role";
import type { ReactNode } from "react";

export default async function PatientGroupLayout({ children }: { children: ReactNode }) {
  await assertPortalRole("patient", "/patient/dashboard");
  return children;
}
