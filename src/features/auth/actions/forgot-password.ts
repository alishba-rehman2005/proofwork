"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { recordAuditLog } from "@/lib/audit";

export type ForgotPasswordState = {
  submitted?: boolean;
  error?: string;
};

const schema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));

/**
 * Records a password reset request.
 *
 * The response is identical whether or not the address exists, so this cannot
 * be used to discover which emails are registered. Delivery is not automated:
 * the request is written to the audit log for an administrator to action.
 */
export async function requestPasswordResetAction(
  _previousState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse(String(formData.get("email") ?? ""));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const [account] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data))
    .limit(1);

  await recordAuditLog({
    actorUserId: account?.id ?? null,
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "user",
    entityId: account?.id,
    newValues: { email: parsed.data, accountExists: Boolean(account) },
  });

  return { submitted: true };
}
