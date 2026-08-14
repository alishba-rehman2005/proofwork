import { logoutAction } from "@/features/auth/actions/logout";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/server/auth/authorization";

export default async function DashboardPage() {
  const user = await requireRole([
    APP_ROLES.CANDIDATE,
    APP_ROLES.REVIEWER,
    APP_ROLES.RECRUITER,
    APP_ROLES.ADMIN,
  ]);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">ProofWork Dashboard</h1>

      <p className="mt-4">Signed in as: {user.email}</p>

      <p className="mt-2">Primary role: {user.primaryRole ?? "Not assigned"}</p>

      <p className="mt-2">Roles: {user.roles.join(", ")}</p>

      <form
        action={logoutAction}
        className="mt-6"
      >
        <button
          type="submit"
          className="rounded-lg border px-4 py-2"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
