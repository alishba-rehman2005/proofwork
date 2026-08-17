"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { skillRequests, skills, users } from "@/db/schema";
import { recordAuditLog } from "@/lib/audit";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { notify } from "@/lib/notifications";

import { slugifyName } from "@/features/profiles/utils/slug";

export type CatalogueActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const skillSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Skill name must be at least 2 characters.")
    .max(80, "Skill name must not exceed 80 characters."),
  categoryId: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .refine((value) => value === null || z.uuid().safeParse(value).success, "Invalid category."),
});

function revalidateCatalogue() {
  revalidatePath("/admin");
  revalidatePath("/skills");
}

/** Adds a skill to the catalogue. */
export async function createSkillAction(
  _previousState: CatalogueActionState,
  formData: FormData,
): Promise<CatalogueActionState> {
  const admin = await requireRole([APP_ROLES.ADMIN]);

  const parsed = skillSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the skill.",
      errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await db.insert(skills).values({
      name: parsed.data.name,
      slug: slugifyName(parsed.data.name),
      categoryId: parsed.data.categoryId,
      isActive: true,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false, message: "That skill already exists." };
    }

    throw error;
  }

  await recordAuditLog({
    actorUserId: admin.id,
    action: "SKILL_CREATED",
    entityType: "skill",
    newValues: { name: parsed.data.name },
  });

  revalidateCatalogue();

  return { success: true, message: `${parsed.data.name} added to the catalogue.` };
}

/**
 * Retires or restores a skill.
 *
 * Deactivating rather than deleting: candidates may already have the skill on
 * their profile, and removing the row would take their verified work with it.
 */
export async function toggleSkillAction(formData: FormData): Promise<void> {
  const admin = await requireRole([APP_ROLES.ADMIN]);

  const skillId = String(formData.get("skillId") ?? "");

  if (!z.uuid().safeParse(skillId).success) {
    return;
  }

  const [skill] = await db
    .select({ id: skills.id, isActive: skills.isActive, name: skills.name })
    .from(skills)
    .where(eq(skills.id, skillId))
    .limit(1);

  if (!skill) {
    return;
  }

  await db
    .update(skills)
    .set({ isActive: !skill.isActive, updatedAt: new Date() })
    .where(eq(skills.id, skillId));

  await recordAuditLog({
    actorUserId: admin.id,
    action: skill.isActive ? "SKILL_DEACTIVATED" : "SKILL_REACTIVATED",
    entityType: "skill",
    entityId: skill.id,
    newValues: { name: skill.name, isActive: !skill.isActive },
  });

  revalidateCatalogue();
}

/** Approves a candidate's skill suggestion, adding it to the catalogue. */
export async function decideSkillRequestAction(formData: FormData): Promise<void> {
  const admin = await requireRole([APP_ROLES.ADMIN]);

  const requestId = String(formData.get("requestId") ?? "");
  const approve = String(formData.get("decision") ?? "") === "approve";

  if (!z.uuid().safeParse(requestId).success) {
    return;
  }

  const [request] = await db
    .select({
      id: skillRequests.id,
      proposedName: skillRequests.proposedName,
      requestedById: skillRequests.requestedById,
    })
    .from(skillRequests)
    .where(eq(skillRequests.id, requestId))
    .limit(1);

  if (!request) {
    return;
  }

  if (approve) {
    try {
      await db.insert(skills).values({
        name: request.proposedName,
        slug: slugifyName(request.proposedName),
        isActive: true,
      });
    } catch (error) {
      // An admin may have added it manually in the meantime; approving the
      // request is still the right outcome.
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  await db
    .update(skillRequests)
    .set({
      status: approve ? "APPROVED" : "REJECTED",
      updatedAt: new Date(),
    })
    .where(eq(skillRequests.id, requestId));

  await notify({
    userId: request.requestedById,
    type: "SYSTEM",
    title: approve ? "Skill added" : "Skill suggestion declined",
    message: approve
      ? `${request.proposedName} is now in the catalogue. You can add it to your profile.`
      : `${request.proposedName} was not added to the catalogue.`,
  });

  await recordAuditLog({
    actorUserId: admin.id,
    action: approve ? "SKILL_REQUEST_APPROVED" : "SKILL_REQUEST_REJECTED",
    entityType: "skill_request",
    entityId: requestId,
  });

  revalidateCatalogue();
}

/**
 * Changes an account's status.
 *
 * An admin cannot suspend their own account, which would otherwise be an easy
 * way to lock the last administrator out of the platform.
 */
export async function setAccountStatusAction(formData: FormData): Promise<void> {
  const admin = await requireRole([APP_ROLES.ADMIN]);

  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");

  const allowed = ["ACTIVE", "SUSPENDED", "DISABLED"];

  if (!z.uuid().safeParse(userId).success || !allowed.includes(status)) {
    return;
  }

  if (userId === admin.id) {
    return;
  }

  await db
    .update(users)
    .set({
      accountStatus: status as "ACTIVE" | "SUSPENDED" | "DISABLED",
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await recordAuditLog({
    actorUserId: admin.id,
    action: "ACCOUNT_STATUS_CHANGED",
    entityType: "user",
    entityId: userId,
    newValues: { accountStatus: status },
  });

  revalidatePath("/admin");
}
