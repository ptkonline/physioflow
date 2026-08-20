import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_COOKIE, type PortalRole } from "@/lib/auth-session";

export async function assertPortalRole(expected: PortalRole, home: string) {
  const role = (await cookies()).get(ROLE_COOKIE)?.value;
  if (!role) {
    redirect(`/login?next=${encodeURIComponent(home)}`);
  }
  if (role !== expected) {
    redirect(role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard");
  }
}
