import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/server/auth/authorization";

export default async function ReviewerPage() {
  const user = await requireRole([APP_ROLES.REVIEWER, APP_ROLES.ADMIN]);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Reviewer Workspace</h1>

      <p className="mt-4">Welcome, {user.email}</p>
    </main>
  );
}
