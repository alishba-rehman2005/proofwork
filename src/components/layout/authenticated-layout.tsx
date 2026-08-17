import type { ReactNode } from "react";

import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { getUserDisplayName } from "@/features/account/account";
import { getNavSections } from "@/lib/auth/navigation";
import { getAvailableWorkspaces } from "@/lib/auth/workspaces";

/**
 * Wraps a signed-in route group in the application shell.
 *
 * Shared by every role's layout so the navigation is built one way. The pages
 * underneath run their own role checks and redirect, so an absent session here
 * only means "render nothing around it".
 */
export async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    return <>{children}</>;
  }

  const { roles, primaryRole, email } = session.user;

  // Read live rather than from the session token, which would keep showing the
  // old name until the user signed out and back in after a rename.
  const name = await getUserDisplayName(session.user.id);

  return (
    <AppShell
      sections={getNavSections(roles)}
      workspaces={getAvailableWorkspaces(roles)}
      currentRole={primaryRole}
      email={email ?? ""}
      name={name}
    >
      {children}
    </AppShell>
  );
}
