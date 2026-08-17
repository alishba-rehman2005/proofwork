"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { companies, companyMembers, roles, userRoles, users } from "@/db/schema";
import { recordAuditLog } from "@/lib/audit";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { notify } from "@/lib/notifications";

import { companySchema, getCompanyForUser, inviteColleagueSchema } from "../company";

export type CompanyActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const MAX_MEMBERS = 25;

function failure(error: z.ZodError, message: string): CompanyActionState {
  return {
    success: false,
    message,
    errors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  };
}

/** Only the owner may change company details or membership. */
async function requireCompanyOwner() {
  const user = await requireRole([APP_ROLES.RECRUITER, APP_ROLES.ADMIN]);
  const company = await getCompanyForUser(user.id);

  if (!company) {
    return { user, company: null, allowed: false as const };
  }

  return { user, company, allowed: company.isOwner };
}

export async function updateCompanyAction(
  _previousState: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const { user, company, allowed } = await requireCompanyOwner();

  if (!company) {
    return { success: false, message: "You are not a member of a company." };
  }

  if (!allowed) {
    return { success: false, message: "Only the company owner can edit these details." };
  }

  const parsed = companySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    website: String(formData.get("website") ?? ""),
    logoUrl: String(formData.get("logoUrl") ?? ""),
    industry: String(formData.get("industry") ?? ""),
    location: String(formData.get("location") ?? ""),
  });

  if (!parsed.success) {
    return failure(parsed.error, "Please correct the highlighted fields.");
  }

  await db
    .update(companies)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(companies.id, company.id));

  await recordAuditLog({
    actorUserId: user.id,
    action: "COMPANY_UPDATED",
    entityType: "company",
    entityId: company.id,
    newValues: { name: parsed.data.name },
  });

  revalidatePath("/company");
  revalidatePath("/recruiter");

  return { success: true, message: "Company details saved." };
}

/** Adds an existing recruiter account to the company. */
export async function inviteColleagueAction(
  _previousState: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const { company, allowed } = await requireCompanyOwner();

  if (!company) {
    return { success: false, message: "You are not a member of a company." };
  }

  if (!allowed) {
    return { success: false, message: "Only the company owner can invite colleagues." };
  }

  if (company.members.length >= MAX_MEMBERS) {
    return { success: false, message: `A company can have at most ${MAX_MEMBERS} members.` };
  }

  const parsed = inviteColleagueSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    jobTitle: String(formData.get("jobTitle") ?? ""),
  });

  if (!parsed.success) {
    return failure(parsed.error, "Please correct the invitation.");
  }

  const [invitee] = await db
    .select({ id: users.id, accountStatus: users.accountStatus, role: roles.name })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (!invitee || invitee.role !== APP_ROLES.RECRUITER || invitee.accountStatus !== "ACTIVE") {
    return {
      success: false,
      message: "No active recruiter account was found with that email.",
    };
  }

  try {
    await db.insert(companyMembers).values({
      companyId: company.id,
      userId: invitee.id,
      jobTitle: parsed.data.jobTitle,
      membershipRole: "RECRUITER",
    });
  } catch (error) {
    if (isUniqueViolation(error, "company_members_company_user_unique")) {
      return { success: false, message: "That person is already on your team." };
    }

    throw error;
  }

  await notify({
    userId: invitee.id,
    type: "SYSTEM",
    title: "Added to a company",
    message: `You are now part of ${company.name} on ProofWork.`,
    entityType: "company",
    entityId: company.id,
  });

  revalidatePath("/company");

  return { success: true, message: `${parsed.data.email} added.` };
}

/** Removes a colleague. The owner cannot remove themselves. */
export async function removeColleagueAction(formData: FormData): Promise<void> {
  const { user, company, allowed } = await requireCompanyOwner();

  if (!company || !allowed) {
    return;
  }

  const memberId = String(formData.get("memberId") ?? "");

  if (!z.uuid().safeParse(memberId).success) {
    return;
  }

  const member = company.members.find((row) => row.id === memberId);

  // Removing the owner would leave the company with nobody able to manage it.
  if (!member || member.membershipRole === "OWNER") {
    return;
  }

  await db
    .delete(companyMembers)
    .where(and(eq(companyMembers.id, memberId), eq(companyMembers.companyId, company.id)));

  await recordAuditLog({
    actorUserId: user.id,
    action: "COMPANY_MEMBER_REMOVED",
    entityType: "company",
    entityId: company.id,
    newValues: { removedUserId: member.userId },
  });

  revalidatePath("/company");
}
