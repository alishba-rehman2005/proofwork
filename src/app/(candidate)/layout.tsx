import type { ReactNode } from "react";

import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { getNavSections } from "@/lib/auth/navigation";
import { getAvailableWorkspaces } from "@/lib/auth/workspaces";

export default async function CandidateLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  // The pages underneath run their own role checks and redirect, so an absent
  // session here just means "render nothing around it".
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
