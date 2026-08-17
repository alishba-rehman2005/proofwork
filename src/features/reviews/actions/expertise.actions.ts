"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { reviewerSkills, skills } from "@/db/schema";
import { recordAuditLog } from "@/lib/audit";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { notify } from "@/lib/notifications";

export type ExpertiseActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const grantSchema = z.object({
  reviewerId: z.uuid("Choose a reviewer."),
  skillId: z.uuid("Choose a skill."),
});

function revalidateExpertise() {
  revalidatePath("/admin");
  revalidatePath("/reviewer");
  revalidatePath("/reviewer/expertise");
}

/**
 * Authorises a reviewer to verify one skill.
 *
 * Only an admin can grant this: it is the control that makes a Verified badge
 * mean the work was judged by someone competent in that skill.
 */
export async function grantReviewerSkillAction(
  _previousState: ExpertiseActionState,
  formData: FormData,
): Promise<ExpertiseActionState> {
  const admin = await requireRole([APP_ROLES.ADMIN]);

  const parsed = grantSchema.safeParse({
    reviewerId: String(formData.get("reviewerId") ?? ""),
    skillId: String(formData.get("skillId") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Choose both a reviewer and a skill.",
      errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const [skill] = await db
    .select({ name: skills.name })
    .from(skills)
    .where(eq(skills.id, parsed.data.skillId))
    .limit(1);

  if (!skill) {
    return { success: false, message: "That skill no longer exists." };
  }

  try {
    await db.insert(reviewerSkills).values({
      reviewerId: parsed.data.reviewerId,
      skillId: parsed.data.skillId,
      grantedById: admin.id,
      canVerify: true,
    });
  } catch (error) {
    if (isUniqueViolation(error, "reviewer_skills_reviewer_skill_unique")) {
      // Re-granting a previously revoked skill is the same intent.
      await db
        .update(reviewerSkills)
        .set({ canVerify: true, grantedById: admin.id })
        .where(
          and(
            eq(reviewerSkills.reviewerId, parsed.data.reviewerId),
            eq(reviewerSkills.skillId, parsed.data.skillId),
          ),
        );
    } else {
      throw error;
    }
  }

  await notify({
    userId: parsed.data.reviewerId,
    type: "SYSTEM",
    title: "Review authority granted",
    message: `You can now verify ${skill.name} submissions.`,
    entityType: "skill",
    entityId: parsed.data.skillId,
  });

  await recordAuditLog({
    actorUserId: admin.id,
    action: "REVIEWER_SKILL_GRANTED",
    entityType: "reviewer_skill",
    entityId: parsed.data.skillId,
    newValues: { reviewerId: parsed.data.reviewerId, skill: skill.name },
  });

  revalidateExpertise();

  return { success: true, message: `Granted ${skill.name}.` };
}

/** Withdraws a reviewer's authority over a skill without deleting history. */
export async function revokeReviewerSkillAction(formData: FormData): Promise<void> {
  const admin = await requireRole([APP_ROLES.ADMIN]);

  const grantId = String(formData.get("grantId") ?? "");

  if (!z.uuid().safeParse(grantId).success) {
    return;
  }

  const [grant] = await db
    .select({ reviewerId: reviewerSkills.reviewerId, skillId: reviewerSkills.skillId })
    .from(reviewerSkills)
    .where(eq(reviewerSkills.id, grantId))
    .limit(1);

  if (!grant) {
    return;
  }

  // Kept as a row with canVerify=false so the audit trail shows it was held.
  await db.update(reviewerSkills).set({ canVerify: false }).where(eq(reviewerSkills.id, grantId));

  await recordAuditLog({
    actorUserId: admin.id,
    action: "REVIEWER_SKILL_REVOKED",
    entityType: "reviewer_skill",
    entityId: grant.skillId,
    newValues: { reviewerId: grant.reviewerId },
  });

  revalidateExpertise();
}
