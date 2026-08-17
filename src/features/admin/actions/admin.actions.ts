"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { companies, roles, userRoles, users } from "@/db/schema";
import { recordAuditLog } from "@/lib/audit";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

import { findRoleIdByName, findUserByEmail, getRoleNamesForUser } from "../server/admin.queries";

export type AdminActionState = {
  success?: boolean;
  message?: string;
};

const companyIdSchema = z.uuid("Invalid company reference.");
const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));

function revalidateAdmin() {
  revalidatePath("/admin");
}

/**
 * Loads a pending company and its owner.
 *
 * Scoped to PENDING so a decision cannot be replayed against a company that
 * was already approved or rejected.
 */
async function getPendingCompany(companyId: string) {
  const [row] = await db
    .select({
      id: companies.id,
      name: companies.name,
      status: companies.status,
      ownerId: companies.createdById,
    })
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.status, "PENDING")))
    .limit(1);

  return row ?? null;
}

export async function approveCompanyAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireRole([APP_ROLES.ADMIN]);

  const parsed = companyIdSchema.safeParse(String(formData.get("companyId") ?? ""));

  if (!parsed.success) {
    return { success: false, message: "Invalid company reference." };
  }

  const company = await getPendingCompany(parsed.data);

  if (!company) {
    return { success: false, message: "That company is no longer awaiting review." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(companies)
      .set({ status: "ACTIVE", updatedAt: new Date() })
      .where(eq(companies.id, company.id));

    // The owner was held at PENDING at registration; approving the company is
    // what lets them sign in.
    await tx
      .update(users)
      .set({ accountStatus: "ACTIVE", updatedAt: new Date() })
      .where(eq(users.id, company.ownerId));
  });

  await recordAuditLog({
    actorUserId: admin.id,
    action: "COMPANY_APPROVED",
    entityType: "company",
    entityId: company.id,
    oldValues: { status: "PENDING" },
    newValues: { status: "ACTIVE" },
  });

  revalidateAdmin();

  return { success: true, message: `${company.name} approved.` };
}

export async function rejectCompanyAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireRole([APP_ROLES.ADMIN]);

  const parsed = companyIdSchema.safeParse(String(formData.get("companyId") ?? ""));

  if (!parsed.success) {
    return { success: false, message: "Invalid company reference." };
  }

  const company = await getPendingCompany(parsed.data);

  if (!company) {
    return { success: false, message: "That company is no longer awaiting review." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(companies)
      .set({ status: "ARCHIVED", updatedAt: new Date() })
      .where(eq(companies.id, company.id));

    await tx
      .update(users)
      .set({ accountStatus: "DISABLED", updatedAt: new Date() })
      .where(eq(users.id, company.ownerId));
  });

  await recordAuditLog({
    actorUserId: admin.id,
    action: "COMPANY_REJECTED",
    entityType: "company",
    entityId: company.id,
    oldValues: { status: "PENDING" },
    newValues: { status: "ARCHIVED" },
  });

  revalidateAdmin();

  return { success: true, message: `${company.name} rejected.` };
}

/**
 * Grants the reviewer role to an existing account.
 *
 * Reviewers decide whether a skill becomes Verified, so the role is never
 * self-service: an administrator appoints an account that already exists.
 */
export async function appointReviewerAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireRole([APP_ROLES.ADMIN]);

  const parsed = emailSchema.safeParse(String(formData.get("email") ?? ""));

  if (!parsed.success) {
    return { success: false, message: "Enter a valid email address." };
  }

  const user = await findUserByEmail(parsed.data);

  if (!user) {
    return { success: false, message: "No account found with that email address." };
  }

  const existingRoles = await getRoleNamesForUser(user.id);

  if (existingRoles.includes(APP_ROLES.REVIEWER)) {
    return { success: false, message: `${user.email} is already a reviewer.` };
  }

  const reviewerRoleId = await findRoleIdByName(APP_ROLES.REVIEWER);

  if (!reviewerRoleId) {
    console.error("Cannot appoint a reviewer because the REVIEWER role is missing.");

    return { success: false, message: "Reviewer role is not configured." };
  }

  await db.insert(userRoles).values({
    userId: user.id,
    roleId: reviewerRoleId,
    assignedById: admin.id,
  });

  await recordAuditLog({
    actorUserId: admin.id,
    action: "REVIEWER_APPOINTED",
    entityType: "user",
    entityId: user.id,
    newValues: { email: user.email, role: APP_ROLES.REVIEWER },
  });

  revalidateAdmin();

  return { success: true, message: `${user.email} is now a reviewer.` };
}

export async function revokeReviewerAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireRole([APP_ROLES.ADMIN]);

  const parsed = z.uuid().safeParse(String(formData.get("userId") ?? ""));

  if (!parsed.success) {
    return { success: false, message: "Invalid user reference." };
  }

  const reviewerRoleId = await findRoleIdByName(APP_ROLES.REVIEWER);

  if (!reviewerRoleId) {
    return { success: false, message: "Reviewer role is not configured." };
  }

  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.id, reviewerRoleId))
    .limit(1);

  if (!role) {
    return { success: false, message: "Reviewer role is not configured." };
  }

  await db
    .delete(userRoles)
    .where(and(eq(userRoles.userId, parsed.data), eq(userRoles.roleId, reviewerRoleId)));

  await recordAuditLog({
    actorUserId: admin.id,
    action: "REVIEWER_REVOKED",
    entityType: "user",
    entityId: parsed.data,
    oldValues: { role: APP_ROLES.REVIEWER },
  });

  revalidateAdmin();

  return { success: true, message: "Reviewer access revoked." };
}
