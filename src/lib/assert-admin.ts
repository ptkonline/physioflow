import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminEnv, readAdminToken } from "@/lib/admin-session";
import { ROLE_COOKIE, UID_COOKIE } from "@/lib/auth-session";

export async function assertAdmin() {
  const env = adminEnv();
  if (!env.ready) {
    redirect("/unauthorized");
  }
  const jar = await cookies();
  const session = await readAdminToken(jar.get(ADMIN_COOKIE)?.value);
  if (session) return session;
  const signedIn = Boolean(jar.get(ROLE_COOKIE)?.value || jar.get(UID_COOKIE)?.value);
  redirect(signedIn ? "/unauthorized" : "/login?next=%2Fadmin%2Fdashboard");
}
