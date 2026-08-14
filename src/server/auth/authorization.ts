import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { type AppRole, hasAnyRole } from "@/lib/auth/permissions";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user;
}

export async function requireRole(allowedRoles: AppRole[]) {
  const user = await requireUser();

  if (!hasAnyRole(user.roles, allowedRoles)) {
    redirect("/unauthorized");
  }

  return user;
}
