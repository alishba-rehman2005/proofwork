import type { ReactNode } from "react";

import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
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

  return (
    <AppShell
      sections={getNavSections(roles)}
      workspaces={getAvailableWorkspaces(roles)}
      currentRole={primaryRole}
      email={email ?? ""}
    >
      {children}
    </AppShell>
  );
}
