import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { candidateProfiles, roles, userRoles, users } from "@/db/schema";

/*
|--------------------------------------------------------------------------
| ACCOUNT
|--------------------------------------------------------------------------
| Settings shared by every role. Candidates keep their public profile
| separately; this is the account behind it.
*/

export const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name must not exceed 100 characters."),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must not exceed 128 characters.")
      .regex(/[A-Z]/, "Password must contain an uppercase letter.")
      .regex(/[a-z]/, "Password must contain a lowercase letter.")
      .regex(/[0-9]/, "Password must contain a number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from your current one.",
  });

export type AccountDetails = {
  id: string;
  email: string;
  name: string | null;
  accountStatus: string;
  createdAt: Date;
  roleNames: string[];
  /** Present only when the account also has a candidate profile. */
  candidateSlug: string | null;
  hasPassword: boolean;
};

export async function getAccountDetails(userId: string): Promise<AccountDetails | null> {
  const [account] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      accountStatus: users.accountStatus,
      createdAt: users.createdAt,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!account) {
    return null;
  }

  const [roleRows, profileRows] = await Promise.all([
    db
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId)),

    db
      .select({ slug: candidateProfiles.slug })
      .from(candidateProfiles)
      .where(eq(candidateProfiles.userId, userId))
      .limit(1),
  ]);

  return {
    id: account.id,
    email: account.email,
    name: account.name,
    accountStatus: account.accountStatus,
    createdAt: account.createdAt,
    roleNames: roleRows.map((row) => row.name),
    candidateSlug: profileRows[0]?.slug ?? null,
    // OAuth accounts have no password to change.
    hasPassword: Boolean(account.passwordHash),
  };
}

/** Current display name, read live so a rename shows immediately. */
export async function getUserDisplayName(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row?.name ?? null;
}
