import Link from "next/link";

import { auth } from "@/auth";
import { logoutAction } from "@/features/auth/actions/logout";
import { APP_ROLES } from "@/lib/auth/permissions";
import { getAvailableWorkspaces } from "@/lib/auth/workspaces";

import { WorkspaceSwitcher } from "./workspace-switcher";

/**
 * Navigation for signed-in pages.
 *
 * Renders nothing when there is no session; the pages underneath perform their
 * own role checks and redirect, so this only decides what to show.
 */
export async function AppHeader() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const { roles, primaryRole, email } = session.user;
  const workspaces = getAvailableWorkspaces(roles);
  const isCandidate = roles.includes(APP_ROLES.CANDIDATE);

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 p-4">
        <Link href="/dashboard" className="text-lg font-semibold">
          ProofWork
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
            Dashboard
          </Link>

          {isCandidate && (
            <>
              <Link href="/profile" className="text-slate-600 hover:text-slate-900">
                My profile
              </Link>

              <Link href="/profile/edit" className="text-slate-600 hover:text-slate-900">
                Edit profile
              </Link>
            </>
          )}
        </div>

        <div className="ms-auto flex items-center gap-3">
          <WorkspaceSwitcher workspaces={workspaces} currentRole={primaryRole} />

          <span className="hidden text-sm text-slate-500 sm:inline">{email}</span>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm transition-colors hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
