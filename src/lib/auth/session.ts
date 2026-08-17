import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { roles, userRoles, users } from "@/db/schema";
import { type AppRole, hasAnyRole } from "@/lib/auth/permissions";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // JWTs are intentionally not trusted as the final authorization source.
  // Re-reading the account means suspensions and role changes take effect on
  // the next protected request instead of waiting for the token to expire.
  const [account] = await db
    .select({
      id: users.id,
      accountStatus: users.accountStatus,
      primaryRoleId: users.primaryRoleId,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!account || account.accountStatus !== "ACTIVE") {
    redirect("/unauthorized");
  }

  const assignedRoles = await db
    .select({ id: roles.id, name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, account.id));

  const liveRoles = assignedRoles.map((role) => role.name);
  const primaryRole = assignedRoles.find((role) => role.id === account.primaryRoleId)?.name ?? null;

  return { ...session.user, roles: liveRoles, primaryRole };
}

export async function requireRole(allowedRoles: AppRole[]) {
  const user = await requireUser();

  if (!hasAnyRole(user.roles, allowedRoles)) {
    redirect("/unauthorized");
  }

  return user;
}
