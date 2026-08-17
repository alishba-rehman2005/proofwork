import { and, asc, desc, eq, notInArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  assessmentAssignments,
  candidateProfiles,
  candidateSkills,
  reviews,
  skillCategories,
  skills,
  submissions,
  verificationRequests,
} from "@/db/schema";

export type SkillOption = {
  id: string;
  name: string;
  categoryName: string | null;
};

/** Active catalogue skills the candidate has not already added. */
export async function getAvailableSkills(candidateId: string): Promise<SkillOption[]> {
  const taken = await db
    .select({ skillId: candidateSkills.skillId })
    .from(candidateSkills)
    .where(eq(candidateSkills.candidateId, candidateId));

  const takenIds = taken.map((row) => row.skillId);

  const rows = await db
    .select({
      id: skills.id,
      name: skills.name,
      categoryName: skillCategories.name,
    })
    .from(skills)
    .leftJoin(skillCategories, eq(skills.categoryId, skillCategories.id))
    .where(
      takenIds.length > 0
        ? and(eq(skills.isActive, true), notInArray(skills.id, takenIds))
        : eq(skills.isActive, true),
    )
    .orderBy(asc(skillCategories.name), asc(skills.name));

  return rows;
}

export type CandidateSkillRow = {
  id: string;
  skillId: string;
  skillName: string;
  categoryName: string | null;
  experienceLevel: string;
  verificationStatus: string;
  currentScore: string | null;
  verifiedAt: Date | null;
  /** Open assignment, if the skill is mid-verification. */
  assignmentId: string | null;
  assignmentStatus: string | null;
  deadline: Date | null;
  requestStatus: string | null;
  projectsCompleted: number;
  reviewerFeedback: string | null;
};

/**
 * A candidate's skills with everything the profile needs to show for each one:
 * level, verification status, score, open assignment and latest feedback.
 */
export async function getCandidateSkills(candidateId: string): Promise<CandidateSkillRow[]> {
  const rows = await db
    .select({
      id: candidateSkills.id,
      skillId: candidateSkills.skillId,
      skillName: skills.name,
      categoryName: skillCategories.name,
      experienceLevel: candidateSkills.experienceLevel,
      verificationStatus: candidateSkills.verificationStatus,
      currentScore: candidateSkills.currentScore,
      verifiedAt: candidateSkills.verifiedAt,
      assignmentId: assessmentAssignments.id,
      assignmentStatus: assessmentAssignments.status,
      deadline: assessmentAssignments.deadline,
      requestStatus: verificationRequests.status,
    })
    .from(candidateSkills)
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .leftJoin(skillCategories, eq(skills.categoryId, skillCategories.id))
    .leftJoin(
      assessmentAssignments,
      and(
        eq(assessmentAssignments.candidateSkillId, candidateSkills.id),
        notInArray(assessmentAssignments.status, ["CANCELLED", "EXPIRED"]),
      ),
    )
    .leftJoin(verificationRequests, eq(verificationRequests.candidateSkillId, candidateSkills.id))
    .where(eq(candidateSkills.candidateId, candidateId))
    .orderBy(asc(skills.name));

  // Latest reviewer feedback per candidate skill, resolved separately to keep
  // the main query flat.
  const feedback = await db
    .select({
      candidateSkillId: assessmentAssignments.candidateSkillId,
      candidateFeedback: reviews.candidateFeedback,
      reviewedAt: reviews.reviewedAt,
    })
    .from(reviews)
    .innerJoin(submissions, eq(reviews.submissionId, submissions.id))
    .innerJoin(assessmentAssignments, eq(submissions.assignmentId, assessmentAssignments.id))
    .orderBy(desc(reviews.reviewedAt));

  const latestFeedback = new Map<string, string>();

  for (const row of feedback) {
    if (!latestFeedback.has(row.candidateSkillId)) {
      latestFeedback.set(row.candidateSkillId, row.candidateFeedback);
    }
  }

  const approvedCounts = await db
    .select({
      candidateSkillId: assessmentAssignments.candidateSkillId,
      total: sql<number>`count(*)::int`,
    })
    .from(assessmentAssignments)
    .where(eq(assessmentAssignments.status, "APPROVED"))
    .groupBy(assessmentAssignments.candidateSkillId);

  const completed = new Map(approvedCounts.map((row) => [row.candidateSkillId, row.total]));

  // A skill can pick up several assignment rows over time; keep the newest.
  const deduped = new Map<string, CandidateSkillRow>();

  for (const row of rows) {
    const existing = deduped.get(row.id);

    if (!existing || (row.deadline && existing.deadline && row.deadline > existing.deadline)) {
      deduped.set(row.id, {
        ...row,
        projectsCompleted: completed.get(row.id) ?? 0,
        reviewerFeedback: latestFeedback.get(row.id) ?? null,
      });
    }
  }

  return [...deduped.values()];
}

/** Verified skills only, used by the public profile and recruiter search. */
export async function getVerifiedSkills(candidateId: string) {
  return db
    .select({
      id: candidateSkills.id,
      skillName: skills.name,
      currentScore: candidateSkills.currentScore,
      verifiedAt: candidateSkills.verifiedAt,
      experienceLevel: candidateSkills.experienceLevel,
    })
    .from(candidateSkills)
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .where(
      and(
        eq(candidateSkills.candidateId, candidateId),
        eq(candidateSkills.verificationStatus, "VERIFIED"),
      ),
    )
    .orderBy(desc(candidateSkills.currentScore));
}

/** Resolves the candidate profile id owned by a user. */
export async function getCandidateIdForUser(userId: string): Promise<string | null> {
  const [profile] = await db
    .select({ id: candidateProfiles.id })
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, userId))
    .limit(1);

  return profile?.id ?? null;
}

/** Full skill catalogue grouped for admin management. */
export async function getSkillCatalogue() {
  return db
    .select({
      id: skills.id,
      name: skills.name,
      slug: skills.slug,
      isActive: skills.isActive,
      categoryName: skillCategories.name,
    })
    .from(skills)
    .leftJoin(skillCategories, eq(skills.categoryId, skillCategories.id))
    .orderBy(asc(skillCategories.name), asc(skills.name));
}
