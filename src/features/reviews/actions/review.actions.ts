"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  assessmentAssignments,
  candidateProfiles,
  candidateSkills,
  reviewCriterionScores,
  reviews,
  submissions,
  verificationRequests,
} from "@/db/schema";
import { recordAuditLog } from "@/lib/audit";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { notify, recordActivity } from "@/lib/notifications";

import { reviewSchema } from "@/features/submissions/validation/submission.schema";

import { getSubmissionForReview } from "../server/review.queries";
import { calculateScore, clampScore } from "../scoring";

export type ReviewActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const REVIEWERS = [APP_ROLES.REVIEWER, APP_ROLES.ADMIN];

function revalidateReview(assignmentId: string) {
  revalidatePath("/reviewer");
  revalidatePath("/skills");
  revalidatePath("/assessments");
  revalidatePath(`/assessments/${assignmentId}`);
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}

/**
 * Claims a submission and marks it under review.
 *
 * Claiming an unassigned submission also records the reviewer, so two people
 * cannot unknowingly review the same work.
 */
export async function claimReviewAction(formData: FormData): Promise<void> {
  const user = await requireRole(REVIEWERS);

  const submissionId = String(formData.get("submissionId") ?? "");

  if (!z.uuid().safeParse(submissionId).success) {
    return;
  }

  const detail = await getSubmissionForReview(submissionId);

  if (!detail || detail.submissionStatus !== "SUBMITTED") {
    return;
  }

  if (detail.reviewerId && detail.reviewerId !== user.id) {
    return;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(submissions)
      .set({ status: "UNDER_REVIEW", updatedAt: new Date() })
      .where(eq(submissions.id, submissionId));

    await tx
      .update(assessmentAssignments)
      .set({ status: "UNDER_REVIEW", reviewerId: user.id, updatedAt: new Date() })
      .where(eq(assessmentAssignments.id, detail.assignmentId));

    await tx
      .update(candidateSkills)
      .set({ verificationStatus: "UNDER_REVIEW", updatedAt: new Date() })
      .where(eq(candidateSkills.id, detail.candidateSkillId));
  });

  revalidateReview(detail.assignmentId);
}

/**
 * Records the review and applies its consequence.
 *
 * Approving is the only path that verifies a skill, and it is refused when the
 * rubric score falls below the assessment's passing mark - otherwise the
 * Verified badge would not mean what it claims.
 */
export async function submitReviewAction(
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const user = await requireRole(REVIEWERS);

  const parsed = reviewSchema.safeParse({
    submissionId: formData.get("submissionId"),
    outcome: formData.get("outcome"),
    candidateFeedback: String(formData.get("candidateFeedback") ?? ""),
    internalNotes: String(formData.get("internalNotes") ?? ""),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the review.",
      errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const detail = await getSubmissionForReview(parsed.data.submissionId);

  if (!detail) {
    return { success: false, message: "Submission not found." };
  }

  if (detail.review) {
    return { success: false, message: "This submission has already been reviewed." };
  }

  if (detail.reviewerId && detail.reviewerId !== user.id) {
    return { success: false, message: "This submission is assigned to another reviewer." };
  }

  if (detail.criteria.length === 0) {
    return { success: false, message: "This assessment has no rubric to score against." };
  }

  const scored = detail.criteria.map((criterion) => {
    const raw = Number(formData.get(`score_${criterion.id}`) ?? 0);
    const maximumPoints = Number(criterion.maximumPoints);

    return {
      criterionId: criterion.id,
      score: clampScore(raw, maximumPoints),
      maximumPoints,
      weight: Number(criterion.weight),
      comment: String(formData.get(`comment_${criterion.id}`) ?? "").trim() || null,
    };
  });

  const result = calculateScore(scored, detail.maximumScore, detail.passingScore);

  if (parsed.data.outcome === "APPROVED" && !result.passed) {
    return {
      success: false,
      message: `Scored ${result.totalScore} of ${detail.maximumScore}, below the ${detail.passingScore} pass mark. Request changes or reject instead.`,
    };
  }

  const outcome = parsed.data.outcome;

  const skillStatus =
    outcome === "APPROVED" ? "VERIFIED" : outcome === "REJECTED" ? "REJECTED" : "IN_PROGRESS";

  const assignmentStatus =
    outcome === "APPROVED" ? "APPROVED" : outcome === "REJECTED" ? "REJECTED" : "CHANGES_REQUESTED";

  await db.transaction(async (tx) => {
    const [review] = await tx
      .insert(reviews)
      .values({
        submissionId: detail.submissionId,
        reviewerId: user.id,
        outcome,
        totalScore: result.totalScore.toFixed(2),
        candidateFeedback: parsed.data.candidateFeedback,
        internalNotes: parsed.data.internalNotes,
      })
      .returning({ id: reviews.id });

    if (!review) {
      throw new Error("Failed to record review.");
    }

    await tx.insert(reviewCriterionScores).values(
      scored.map((item) => ({
        reviewId: review.id,
        rubricCriterionId: item.criterionId,
        score: item.score.toFixed(2),
        comment: item.comment,
      })),
    );

    await tx
      .update(submissions)
      .set({
        status: assignmentStatus === "APPROVED" ? "APPROVED" : assignmentStatus,
        updatedAt: new Date(),
      })
      .where(eq(submissions.id, detail.submissionId));

    await tx
      .update(assessmentAssignments)
      .set({
        status: assignmentStatus,
        completedAt: outcome === "CHANGES_REQUESTED" ? null : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(assessmentAssignments.id, detail.assignmentId));

    await tx
      .update(candidateSkills)
      .set({
        verificationStatus: skillStatus,
        currentScore: outcome === "APPROVED" ? result.percentage.toFixed(2) : null,
        verifiedAt: outcome === "APPROVED" ? new Date() : null,
        verifiedById: outcome === "APPROVED" ? user.id : null,
        updatedAt: new Date(),
      })
      .where(eq(candidateSkills.id, detail.candidateSkillId));

    if (outcome !== "CHANGES_REQUESTED") {
      await tx
        .update(verificationRequests)
        .set({
          status: outcome === "APPROVED" ? "COMPLETED" : "REJECTED",
          reviewedById: user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(verificationRequests.candidateSkillId, detail.candidateSkillId));
    }
  });

  const [candidate] = await db
    .select({ userId: candidateProfiles.userId })
    .from(candidateProfiles)
    .where(eq(candidateProfiles.id, detail.candidateId))
    .limit(1);

  if (candidate) {
    const messages = {
      APPROVED: {
        type: "SKILL_VERIFIED" as const,
        title: `${detail.skillName} verified`,
        message: `You scored ${result.percentage}% on ${detail.assessmentTitle}.`,
      },
      CHANGES_REQUESTED: {
        type: "CHANGES_REQUESTED" as const,
        title: "Changes requested",
        message: `Your reviewer has asked for changes on ${detail.assessmentTitle}.`,
      },
      REJECTED: {
        type: "SKILL_REJECTED" as const,
        title: `${detail.skillName} not verified`,
        message: `Your submission for ${detail.assessmentTitle} was not approved.`,
      },
    };

    await notify({
      userId: candidate.userId,
      ...messages[outcome],
      entityType: "assignment",
      entityId: detail.assignmentId,
    });
  }

  await recordActivity({
    candidateId: detail.candidateId,
    type: outcome === "APPROVED" ? "SKILL_VERIFIED" : "REVIEW_RECEIVED",
    entityType: "assignment",
    entityId: detail.assignmentId,
    metadata: { outcome, score: result.percentage, skill: detail.skillName },
  });

  await recordAuditLog({
    actorUserId: user.id,
    action: `REVIEW_${outcome}`,
    entityType: "submission",
    entityId: detail.submissionId,
    newValues: { totalScore: result.totalScore, percentage: result.percentage },
  });

  revalidateReview(detail.assignmentId);

  return {
    success: true,
    message:
      outcome === "APPROVED"
        ? `Approved. ${detail.skillName} is now verified at ${result.percentage}%.`
        : outcome === "CHANGES_REQUESTED"
          ? "Changes requested. The candidate can resubmit."
          : "Submission rejected.",
  };
}
