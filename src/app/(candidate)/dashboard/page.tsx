import { auth } from "@/auth";
import { logoutAction } from "@/features/auth/actions/logout";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">ProofWork Dashboard</h1>

      <p className="mt-4">Signed in as: {session?.user?.email ?? "Unknown user"}</p>

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
