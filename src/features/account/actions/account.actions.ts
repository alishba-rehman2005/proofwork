"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { candidateProfiles, users } from "@/db/schema";
import { recordAuditLog } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";

import { accountSchema, passwordChangeSchema } from "../account";

export type AccountActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const BCRYPT_COST = 12;

function failure(error: z.ZodError, message: string): AccountActionState {
  return {
    success: false,
    message,
    errors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  };
}

/**
 * Updates the display name.
 *
 * A candidate's public profile name is kept in step, so the two cannot drift
 * and show different people the same account under different names.
 */
export async function updateAccountAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();

  const parsed = accountSchema.safeParse({ name: String(formData.get("name") ?? "") });

  if (!parsed.success) {
    return failure(parsed.error, "Please correct the highlighted fields.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ name: parsed.data.name, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    await tx
      .update(candidateProfiles)
      .set({ fullName: parsed.data.name, updatedAt: new Date() })
      .where(eq(candidateProfiles.userId, user.id));
  });

  revalidatePath("/account");
  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { success: true, message: "Account updated." };
}

/**
 * Changes the password.
 *
 * The current password is verified first: a hijacked session must not be
 * enough on its own to lock the real owner out.
 */
export async function changePasswordAction(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return failure(parsed.error, "Please correct the highlighted fields.");
  }

  const [account] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!account?.passwordHash) {
    return { success: false, message: "This account does not use a password." };
  }

  const matches = await bcrypt.compare(parsed.data.currentPassword, account.passwordHash);

  if (!matches) {
    return {
      success: false,
      message: "That is not your current password.",
      errors: { currentPassword: ["Incorrect password."] },
    };
  }

  await db
    .update(users)
    .set({
      passwordHash: await bcrypt.hash(parsed.data.newPassword, BCRYPT_COST),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  await recordAuditLog({
    actorUserId: user.id,
    action: "PASSWORD_CHANGED",
    entityType: "user",
    entityId: user.id,
  });

  revalidatePath("/account");

  return { success: true, message: "Password changed." };
}
