import { assertAdmin } from "@/lib/assert-admin";
import { AdminChrome } from "@/components/admin/AdminChrome";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await assertAdmin();
  return <AdminChrome email={session.email}>{children}</AdminChrome>;
}
