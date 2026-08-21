import { adminEnv } from "@/lib/admin-session";
import { UnauthorizedView } from "@/components/admin/UnauthorizedView";

export default function UnauthorizedPage() {
  return <UnauthorizedView envReady={adminEnv().ready} />;
}
