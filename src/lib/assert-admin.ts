import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminEnv, readAdminToken } from "@/lib/admin-session";

export async function assertAdmin() {
  const env = adminEnv();
  if (!env.ready) {
    redirect("/admin/login?error=env");
  }
  const jar = await cookies();
  const session = await readAdminToken(jar.get(ADMIN_COOKIE)?.value);
  if (session) return session;
  redirect("/admin/login?next=%2Fadmin%2Fdashboard");
}
