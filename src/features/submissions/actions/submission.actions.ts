"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  assessmentAssignments,
  assessments,
  candidateSkills,
  submissionEvidence,
  submissions,
} from "@/db/schema";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { notify, recordActivity } from "@/lib/notifications";

import { getCandidateIdForUser } from "@/features/skills/server/skills.queries";

import { submissionSchema } from "../validation/submission.schema";

export type SubmissionActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/** Statuses from which a candidate may still submit work. */
const SUBMITTABLE = ["ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED"];

function revalidateAssessment(assignmentId: string) {
  revalidatePath("/assessments");
  revalidatePath(`/assessments/${assignmentId}`);
  revalidatePath("/skills");
  revalidatePath("/reviewer");
  revalidatePath("/dashboard");
}

/** Loads an assignment together with the candidate that owns it. */
async function getOwnedAssignment(assignmentId: string, candidateId: string) {
  const [row] = await db
    .select({
      id: assessmentAssignments.id,
      status: assessmentAssignments.status,
      deadline: assessmentAssignments.deadline,
      maxAttempts: assessmentAssignments.maxAttempts,
      reviewerId: assessmentAssignments.reviewerId,
      candidateSkillId: assessmentAssignments.candidateSkillId,
      assessmentId: assessmentAssignments.assessmentId,
    })
    .from(assessmentAssignments)
    .innerJoin(candidateSkills, eq(assessmentAssignments.candidateSkillId, candidateSkills.id))
    .where(
      and(eq(assessmentAssignments.id, assignmentId), eq(candidateSkills.candidateId, candidateId)),
    )
    .limit(1);

  return row ?? null;
}

/** Marks the assignment started so the deadline clock is visible to both sides. */
export async function startAssessmentAction(formData: FormData): Promise<void> {
  const user = await requireRole([APP_ROLES.CANDIDATE]);
  const candidateId = await getCandidateIdForUser(user.id);

  if (!candidateId) {
    return;
  }

  const assignmentId = String(formData.get("assignmentId") ?? "");

  if (!z.uuid().safeParse(assignmentId).success) {
    return;
  }

  const assignment = await getOwnedAssignment(assignmentId, candidateId);

  if (!assignment || assignment.status !== "ASSIGNED") {
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(assessmentAssignments)
      .set({ status: "IN_PROGRESS", startedAt: new Date(), updatedAt: new Date() })
      .where(eq(assessmentAssignments.id, assignment.id));

    await tx
      .update(candidateSkills)
      .set({ verificationStatus: "IN_PROGRESS", updatedAt: new Date() })
      .where(eq(candidateSkills.id, assignment.candidateSkillId));
  });

  await recordActivity({
    candidateId,
    type: "ASSESSMENT_STARTED",
    entityType: "assignment",
    entityId: assignment.id,
  });

  revalidateAssessment(assignment.id);
}

/**
 * Records an attempt.
 *
 * Attempts are capped and the deadline is enforced server-side: the UI hides
 * the form once either is exhausted, but that is a convenience, not a control.
 */
export async function submitAssessmentAction(
  _previousState: SubmissionActionState,
  formData: FormData,
): Promise<SubmissionActionState> {
  const user = await requireRole([APP_ROLES.CANDIDATE]);
  const candidateId = await getCandidateIdForUser(user.id);

  if (!candidateId) {
    return { success: false, message: "We could not find your candidate profile." };
  }

  const parsed = submissionSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    githubUrl: String(formData.get("githubUrl") ?? ""),
    liveUrl: String(formData.get("liveUrl") ?? ""),
    figmaUrl: String(formData.get("figmaUrl") ?? ""),
    documentUrl: String(formData.get("documentUrl") ?? ""),
    screenshotUrl: String(formData.get("screenshotUrl") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the submission.",
      errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const assignment = await getOwnedAssignment(parsed.data.assignmentId, candidateId);

  if (!assignment) {
    return { success: false, message: "Assignment not found." };
  }

  if (!SUBMITTABLE.includes(assignment.status)) {
    return { success: false, message: "This assessment is no longer open for submissions." };
  }

  if (assignment.deadline.getTime() < Date.now()) {
    return { success: false, message: "The deadline for this assessment has passed." };
  }

  const [attempts] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(submissions)
    .where(eq(submissions.assignmentId, assignment.id));

  const used = attempts?.total ?? 0;

  if (used >= assignment.maxAttempts) {
    return {
      success: false,
      message: `You have used all ${assignment.maxAttempts} attempt(s) for this assessment.`,
    };
  }

  const evidenceRows = [
    { type: "GITHUB_REPOSITORY" as const, url: parsed.data.githubUrl, title: "Repository" },
    { type: "LIVE_DEPLOYMENT" as const, url: parsed.data.liveUrl, title: "Live deployment" },
    { type: "FIGMA_URL" as const, url: parsed.data.figmaUrl, title: "Figma file" },
    { type: "DOCUMENT" as const, url: parsed.data.documentUrl, title: "Documentation" },
    { type: "SCREENSHOT" as const, url: parsed.data.screenshotUrl, title: "Screenshot" },
  ].filter((row): row is { type: typeof row.type; url: string; title: string } => Boolean(row.url));

  await db.transaction(async (tx) => {
    const [submission] = await tx
      .insert(submissions)
      .values({
        assignmentId: assignment.id,
        attemptNumber: used + 1,
        notes: parsed.data.notes,
        status: "SUBMITTED",
      })
      .returning({ id: submissions.id });

    if (!submission) {
      throw new Error("Failed to record submission.");
    }

    await tx.insert(submissionEvidence).values(
      evidenceRows.map((row) => ({
        submissionId: submission.id,
        type: row.type,
        title: row.title,
        url: row.url,
      })),
    );

    await tx
      .update(assessmentAssignments)
      .set({ status: "SUBMITTED", submittedAt: new Date(), updatedAt: new Date() })
      .where(eq(assessmentAssignments.id, assignment.id));

    await tx
      .update(candidateSkills)
      .set({ verificationStatus: "SUBMITTED", updatedAt: new Date() })
      .where(eq(candidateSkills.id, assignment.candidateSkillId));
  });

  const [assessment] = await db
    .select({ title: assessments.title })
    .from(assessments)
    .where(eq(assessments.id, assignment.assessmentId))
    .limit(1);

  await recordActivity({
    candidateId,
    type: "ASSESSMENT_SUBMITTED",
    entityType: "assignment",
    entityId: assignment.id,
    metadata: { attempt: used + 1 },
  });

  if (assignment.reviewerId) {
    await notify({
      userId: assignment.reviewerId,
      type: "SUBMISSION_RECEIVED",
      title: "Submission received",
      message: `A submission for ${assessment?.title ?? "an assessment"} is ready for review.`,
      entityType: "assignment",
      entityId: assignment.id,
    });
  }

  revalidateAssessment(assignment.id);

  return { success: true, message: "Submitted. Your reviewer has been notified." };
}

/** Withdraws an unreviewed attempt so the candidate can resubmit. */
export async function withdrawSubmissionAction(formData: FormData): Promise<void> {
  const user = await requireRole([APP_ROLES.CANDIDATE]);
  const candidateId = await getCandidateIdForUser(user.id);

  if (!candidateId) {
    return;
  }

  const submissionId = String(formData.get("submissionId") ?? "");

  if (!z.uuid().safeParse(submissionId).success) {
    return;
  }

  const [row] = await db
    .select({
      id: submissions.id,
      status: submissions.status,
      assignmentId: submissions.assignmentId,
      candidateSkillId: assessmentAssignments.candidateSkillId,
    })
    .from(submissions)
    .innerJoin(assessmentAssignments, eq(submissions.assignmentId, assessmentAssignments.id))
    .innerJoin(candidateSkills, eq(assessmentAssignments.candidateSkillId, candidateSkills.id))
    .where(and(eq(submissions.id, submissionId), eq(candidateSkills.candidateId, candidateId)))
    .limit(1);

  // Once a reviewer has started, the attempt belongs to the review record and
  // must not disappear from under them.
  if (!row || row.status !== "SUBMITTED") {
    return;
  }

  await db.transaction(async (tx) => {
    await tx.delete(submissions).where(eq(submissions.id, row.id));

    await tx
      .update(assessmentAssignments)
      .set({ status: "IN_PROGRESS", submittedAt: null, updatedAt: new Date() })
      .where(eq(assessmentAssignments.id, row.assignmentId));

    await tx
      .update(candidateSkills)
      .set({ verificationStatus: "IN_PROGRESS", updatedAt: new Date() })
      .where(eq(candidateSkills.id, row.candidateSkillId));
  });

  revalidateAssessment(row.assignmentId);
}
