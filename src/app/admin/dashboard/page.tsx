import { AdminChrome } from "@/components/admin/AdminChrome";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { assertAdmin } from "@/lib/assert-admin";

export default async function AdminDashboardPage() {
  const session = await assertAdmin();
  return (
    <AdminChrome email={session.email}>
      <AdminDashboard />
    </AdminChrome>
  );
}
