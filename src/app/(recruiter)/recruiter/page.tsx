import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export default async function RecruiterPage() {
  const user = await requireRole([APP_ROLES.RECRUITER, APP_ROLES.ADMIN]);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Recruiter Workspace</h1>

      <p className="mt-4">Welcome, {user.email}</p>
    </main>
  );
}
