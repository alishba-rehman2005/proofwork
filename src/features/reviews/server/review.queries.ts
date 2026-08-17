import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { getVerifiableSkillIds } from "../expertise";
import {
  assessmentAssignments,
  assessments,
  candidateProfiles,
  candidateSkills,
  reviewCriterionScores,
  reviews,
  rubricCriteria,
  skills,
  submissionEvidence,
  submissions,
} from "@/db/schema";

export type ReviewQueueRow = {
  submissionId: string;
  assignmentId: string;
  attemptNumber: number;
  submittedAt: Date;
  status: string;
  assessmentTitle: string;
  skillName: string;
  skillId: string;
  candidateName: string;
  candidateSlug: string;
  deadline: Date;
  isMine: boolean;
};

/**
 * Submissions waiting on a reviewer.
 *
 * Includes unassigned work so nothing can sit in limbo when an assignment was
 * created without naming a reviewer.
 */
export async function getReviewQueue(
  reviewerId: string,
  /** Admins see everything; reviewers see only their granted skills. */
  options: { unrestricted?: boolean } = {},
): Promise<ReviewQueueRow[]> {
  const rows = await db
    .select({
      submissionId: submissions.id,
      assignmentId: assessmentAssignments.id,
      attemptNumber: submissions.attemptNumber,
      submittedAt: submissions.submittedAt,
      status: submissions.status,
      assessmentTitle: assessments.title,
      skillName: skills.name,
      skillId: candidateSkills.skillId,
      candidateName: candidateProfiles.fullName,
      candidateSlug: candidateProfiles.slug,
      deadline: assessmentAssignments.deadline,
      reviewerId: assessmentAssignments.reviewerId,
    })
    .from(submissions)
    .innerJoin(assessmentAssignments, eq(submissions.assignmentId, assessmentAssignments.id))
    .innerJoin(assessments, eq(assessmentAssignments.assessmentId, assessments.id))
    .innerJoin(candidateSkills, eq(assessmentAssignments.candidateSkillId, candidateSkills.id))
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .innerJoin(candidateProfiles, eq(candidateSkills.candidateId, candidateProfiles.id))
    .where(
      and(
        inArray(submissions.status, ["SUBMITTED", "UNDER_REVIEW"]),
        or(
          eq(assessmentAssignments.reviewerId, reviewerId),
          isNull(assessmentAssignments.reviewerId),
        ),
      ),
    )
    .orderBy(asc(assessmentAssignments.deadline));

  const queue = rows.map((row) => ({ ...row, isMine: row.reviewerId === reviewerId }));

  if (options.unrestricted) {
    return queue;
  }

  const allowed = new Set(await getVerifiableSkillIds(reviewerId));

  return queue.filter((row) => allowed.has(row.skillId));
}

/** Everything a reviewer needs on one screen to score a submission. */
export async function getSubmissionForReview(submissionId: string) {
  const [row] = await db
    .select({
      submissionId: submissions.id,
      attemptNumber: submissions.attemptNumber,
      notes: submissions.notes,
      submittedAt: submissions.submittedAt,
      submissionStatus: submissions.status,

      assignmentId: assessmentAssignments.id,
      assignmentStatus: assessmentAssignments.status,
      deadline: assessmentAssignments.deadline,
      reviewerId: assessmentAssignments.reviewerId,
      candidateSkillId: assessmentAssignments.candidateSkillId,

      assessmentId: assessments.id,
      assessmentTitle: assessments.title,
      requirements: assessments.requirements,
      maximumScore: assessments.maximumScore,
      passingScore: assessments.passingScore,

      skillName: skills.name,
      skillId: candidateSkills.skillId,
      candidateId: candidateProfiles.id,
      candidateName: candidateProfiles.fullName,
      candidateSlug: candidateProfiles.slug,
    })
    .from(submissions)
    .innerJoin(assessmentAssignments, eq(submissions.assignmentId, assessmentAssignments.id))
    .innerJoin(assessments, eq(assessmentAssignments.assessmentId, assessments.id))
    .innerJoin(candidateSkills, eq(assessmentAssignments.candidateSkillId, candidateSkills.id))
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .innerJoin(candidateProfiles, eq(candidateSkills.candidateId, candidateProfiles.id))
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!row) {
    return null;
  }

  const [evidence, criteria, existingReview] = await Promise.all([
    db.select().from(submissionEvidence).where(eq(submissionEvidence.submissionId, submissionId)),

    db
      .select()
      .from(rubricCriteria)
      .where(eq(rubricCriteria.assessmentId, row.assessmentId))
      .orderBy(asc(rubricCriteria.displayOrder), asc(rubricCriteria.createdAt)),

    db.select().from(reviews).where(eq(reviews.submissionId, submissionId)).limit(1),
  ]);

  const review = existingReview[0] ?? null;

  const scores = review
    ? await db
        .select()
        .from(reviewCriterionScores)
        .where(eq(reviewCriterionScores.reviewId, review.id))
    : [];

  return { ...row, evidence, criteria, review, scores };
}

/** Reviews written by a reviewer, newest first. */
export async function getCompletedReviews(reviewerId: string) {
  return db
    .select({
      id: reviews.id,
      outcome: reviews.outcome,
      totalScore: reviews.totalScore,
      reviewedAt: reviews.reviewedAt,
      assessmentTitle: assessments.title,
      candidateName: candidateProfiles.fullName,
      skillName: skills.name,
    })
    .from(reviews)
    .innerJoin(submissions, eq(reviews.submissionId, submissions.id))
    .innerJoin(assessmentAssignments, eq(submissions.assignmentId, assessmentAssignments.id))
    .innerJoin(assessments, eq(assessmentAssignments.assessmentId, assessments.id))
    .innerJoin(candidateSkills, eq(assessmentAssignments.candidateSkillId, candidateSkills.id))
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .innerJoin(candidateProfiles, eq(candidateSkills.candidateId, candidateProfiles.id))
    .where(eq(reviews.reviewerId, reviewerId))
    .orderBy(desc(reviews.reviewedAt))
    .limit(50);
}
