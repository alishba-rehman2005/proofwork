"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  assessmentAssignments,
  assessmentResources,
  assessmentSkills,
  assessments,
  candidateProfiles,
  candidateSkills,
  rubricCriteria,
  verificationRequests,
} from "@/db/schema";
import { recordAuditLog } from "@/lib/audit";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { notify } from "@/lib/notifications";

import {
  assessmentResourceSchema,
  assessmentSchema,
  assignAssessmentSchema,
  rubricCriterionSchema,
} from "../validation/assessment.schema";
import { formatDate } from "@/lib/format";

export type AssessmentActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/** Authoring is limited to staff: candidates must never write their own tests. */
const AUTHORS = [APP_ROLES.ADMIN, APP_ROLES.REVIEWER];

function failure(error: z.ZodError, message: string): AssessmentActionState {
  return {
    success: false,
    message,
    errors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  };
}

function revalidateLibrary(assessmentId?: string) {
  revalidatePath("/admin/assessments");
  revalidatePath("/admin");

  if (assessmentId) {
    revalidatePath(`/admin/assessments/${assessmentId}`);
  }
}

export async function createAssessmentAction(
  _previousState: AssessmentActionState,
  formData: FormData,
): Promise<AssessmentActionState> {
  const user = await requireRole(AUTHORS);

  const parsed = assessmentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    requirements: formData.get("requirements"),
    submissionInstructions: formData.get("submissionInstructions"),
    difficulty: formData.get("difficulty"),
    maximumScore: formData.get("maximumScore"),
    passingScore: formData.get("passingScore"),
    maxAttempts: formData.get("maxAttempts"),
    estimatedDurationMinutes: String(formData.get("estimatedDurationMinutes") ?? ""),
    skillIds: formData.getAll("skillIds").map(String).filter(Boolean),
  });

  if (!parsed.success) {
    return failure(parsed.error, "Please correct the highlighted fields.");
  }

  const { skillIds, ...values } = parsed.data;

  const assessmentId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(assessments)
      .values({ ...values, createdById: user.id, status: "DRAFT" })
      .returning({ id: assessments.id });

    if (!created) {
      throw new Error("Failed to create assessment.");
    }

    await tx
      .insert(assessmentSkills)
      .values(skillIds.map((skillId) => ({ assessmentId: created.id, skillId })));

    return created.id;
  });

  await recordAuditLog({
    actorUserId: user.id,
    action: "ASSESSMENT_CREATED",
    entityType: "assessment",
    entityId: assessmentId,
    newValues: { title: values.title },
  });

  revalidateLibrary(assessmentId);

  return { success: true, message: "Assessment created as a draft." };
}

export async function addRubricCriterionAction(
  _previousState: AssessmentActionState,
  formData: FormData,
): Promise<AssessmentActionState> {
  await requireRole(AUTHORS);

  const parsed = rubricCriterionSchema.safeParse({
    assessmentId: formData.get("assessmentId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    maximumPoints: formData.get("maximumPoints"),
    weight: formData.get("weight"),
  });

  if (!parsed.success) {
    return failure(parsed.error, "Please correct the criterion.");
  }

  const { assessmentId, maximumPoints, weight, ...rest } = parsed.data;

  const existing = await db
    .select({ id: rubricCriteria.id })
    .from(rubricCriteria)
    .where(eq(rubricCriteria.assessmentId, assessmentId));

  await db.insert(rubricCriteria).values({
    assessmentId,
    ...rest,
    maximumPoints: maximumPoints.toFixed(2),
    weight: weight.toFixed(2),
    displayOrder: existing.length,
  });

  revalidateLibrary(assessmentId);

  return { success: true, message: "Criterion added." };
}

export async function deleteRubricCriterionAction(formData: FormData): Promise<void> {
  await requireRole(AUTHORS);

  const id = String(formData.get("criterionId") ?? "");
  const assessmentId = String(formData.get("assessmentId") ?? "");

  if (!z.uuid().safeParse(id).success) {
    return;
  }

  await db.delete(rubricCriteria).where(eq(rubricCriteria.id, id));

  revalidateLibrary(assessmentId);
}

export async function addResourceAction(
  _previousState: AssessmentActionState,
  formData: FormData,
): Promise<AssessmentActionState> {
  await requireRole(AUTHORS);

  const parsed = assessmentResourceSchema.safeParse({
    assessmentId: formData.get("assessmentId"),
    title: formData.get("title"),
    url: formData.get("url"),
    resourceType: formData.get("resourceType") ?? "",
  });

  if (!parsed.success) {
    return failure(parsed.error, "Please correct the resource.");
  }

  const { assessmentId, ...rest } = parsed.data;

  const existing = await db
    .select({ id: assessmentResources.id })
    .from(assessmentResources)
    .where(eq(assessmentResources.assessmentId, assessmentId));

  await db
    .insert(assessmentResources)
    .values({ assessmentId, ...rest, displayOrder: existing.length });

  revalidateLibrary(assessmentId);

  return { success: true, message: "Resource added." };
}

export async function deleteResourceAction(formData: FormData): Promise<void> {
  await requireRole(AUTHORS);

  const id = String(formData.get("resourceId") ?? "");
  const assessmentId = String(formData.get("assessmentId") ?? "");

  if (!z.uuid().safeParse(id).success) {
    return;
  }

  await db.delete(assessmentResources).where(eq(assessmentResources.id, id));

  revalidateLibrary(assessmentId);
}

/**
 * Publishes a draft so it can be assigned.
 *
 * Requires at least one rubric criterion: without one a reviewer would have
 * nothing to score against, and the resulting "Verified" badge would be
 * unjustified.
 */
export async function publishAssessmentAction(
  _previousState: AssessmentActionState,
  formData: FormData,
): Promise<AssessmentActionState> {
  const user = await requireRole([APP_ROLES.ADMIN]);

  const assessmentId = String(formData.get("assessmentId") ?? "");

  if (!z.uuid().safeParse(assessmentId).success) {
    return { success: false, message: "Invalid assessment reference." };
  }

  const criteria = await db
    .select({ id: rubricCriteria.id })
    .from(rubricCriteria)
    .where(eq(rubricCriteria.assessmentId, assessmentId));

  if (criteria.length === 0) {
    return {
      success: false,
      message: "Add at least one rubric criterion before publishing.",
    };
  }

  await db
    .update(assessments)
    .set({
      status: "PUBLISHED",
      publishedById: user.id,
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(assessments.id, assessmentId));

  await recordAuditLog({
    actorUserId: user.id,
    action: "ASSESSMENT_PUBLISHED",
    entityType: "assessment",
    entityId: assessmentId,
  });

  revalidateLibrary(assessmentId);

  return { success: true, message: "Assessment published." };
}

export async function archiveAssessmentAction(
  _previousState: AssessmentActionState,
  formData: FormData,
): Promise<AssessmentActionState> {
  const user = await requireRole([APP_ROLES.ADMIN]);

  const assessmentId = String(formData.get("assessmentId") ?? "");

  if (!z.uuid().safeParse(assessmentId).success) {
    return { success: false, message: "Invalid assessment reference." };
  }

  await db
    .update(assessments)
    .set({ status: "ARCHIVED", updatedAt: new Date() })
    .where(eq(assessments.id, assessmentId));

  await recordAuditLog({
    actorUserId: user.id,
    action: "ASSESSMENT_ARCHIVED",
    entityType: "assessment",
    entityId: assessmentId,
  });

  revalidateLibrary(assessmentId);

  return { success: true, message: "Assessment archived." };
}

/**
 * Assigns a published assessment against a pending verification request.
 *
 * This is the step that moves a skill out of UNVERIFIED, so it writes the
 * assignment, the request and the skill status together.
 */
export async function assignAssessmentAction(
  _previousState: AssessmentActionState,
  formData: FormData,
): Promise<AssessmentActionState> {
  const admin = await requireRole([APP_ROLES.ADMIN]);

  const parsed = assignAssessmentSchema.safeParse({
    verificationRequestId: formData.get("verificationRequestId"),
    assessmentId: formData.get("assessmentId"),
    reviewerId: String(formData.get("reviewerId") ?? ""),
    deadline: String(formData.get("deadline") ?? ""),
  });

  if (!parsed.success) {
    return failure(parsed.error, "Please correct the assignment.");
  }

  const [request] = await db
    .select({
      id: verificationRequests.id,
      candidateSkillId: verificationRequests.candidateSkillId,
      candidateId: verificationRequests.candidateId,
    })
    .from(verificationRequests)
    .where(
      and(
        eq(verificationRequests.id, parsed.data.verificationRequestId),
        eq(verificationRequests.status, "PENDING"),
      ),
    )
    .limit(1);

  if (!request) {
    return { success: false, message: "That request is no longer pending." };
  }

  const [assessment] = await db
    .select({ id: assessments.id, title: assessments.title, maxAttempts: assessments.maxAttempts })
    .from(assessments)
    .where(and(eq(assessments.id, parsed.data.assessmentId), eq(assessments.status, "PUBLISHED")))
    .limit(1);

  if (!assessment) {
    return { success: false, message: "Choose a published assessment." };
  }

  const deadline = new Date(`${parsed.data.deadline}T23:59:59.000Z`);

  await db.transaction(async (tx) => {
    await tx.insert(assessmentAssignments).values({
      assessmentId: assessment.id,
      candidateSkillId: request.candidateSkillId,
      reviewerId: parsed.data.reviewerId,
      assignedById: admin.id,
      status: "ASSIGNED",
      deadline,
      maxAttempts: assessment.maxAttempts,
    });

    await tx
      .update(candidateSkills)
      .set({ verificationStatus: "ASSESSMENT_ASSIGNED", updatedAt: new Date() })
      .where(eq(candidateSkills.id, request.candidateSkillId));

    await tx
      .update(verificationRequests)
      .set({
        status: "ASSESSMENT_ASSIGNED",
        reviewedById: admin.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(verificationRequests.id, request.id));
  });

  const [candidate] = await db
    .select({ userId: candidateProfiles.userId })
    .from(candidateProfiles)
    .where(eq(candidateProfiles.id, request.candidateId))
    .limit(1);

  if (candidate) {
    await notify({
      userId: candidate.userId,
      type: "ASSESSMENT_ASSIGNED",
      title: "Assessment assigned",
      message: `${assessment.title} is ready to start. Deadline ${formatDate(deadline)}.`,
      entityType: "assessment",
      entityId: assessment.id,
    });
  }

  if (parsed.data.reviewerId) {
    await notify({
      userId: parsed.data.reviewerId,
      type: "REVIEW_ASSIGNED",
      title: "You have been assigned a review",
      message: `You will review a submission for ${assessment.title}.`,
      entityType: "assessment",
      entityId: assessment.id,
    });
  }

  await recordAuditLog({
    actorUserId: admin.id,
    action: "ASSESSMENT_ASSIGNED",
    entityType: "verification_request",
    entityId: request.id,
    newValues: { assessmentId: assessment.id, deadline: deadline.toISOString() },
  });

  revalidateLibrary();
  revalidatePath("/skills");
  revalidatePath("/assessments");

  return { success: true, message: `${assessment.title} assigned.` };
}
