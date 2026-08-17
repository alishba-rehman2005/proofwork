import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  assessmentAssignments,
  assessmentResources,
  assessmentSkills,
  assessments,
  candidateProfiles,
  candidateSkills,
  reviews,
  roles,
  rubricCriteria,
  skills,
  submissionEvidence,
  submissions,
  userRoles,
  users,
  verificationRequests,
} from "@/db/schema";

export type AssessmentSummary = {
  id: string;
  title: string;
  difficulty: string;
  status: string;
  maximumScore: number;
  passingScore: number;
  skillNames: string[];
};

/** Assessment library, newest first. */
export async function getAssessments(onlyPublished = false): Promise<AssessmentSummary[]> {
  const rows = await db
    .select({
      id: assessments.id,
      title: assessments.title,
      difficulty: assessments.difficulty,
      status: assessments.status,
      maximumScore: assessments.maximumScore,
      passingScore: assessments.passingScore,
    })
    .from(assessments)
    .where(onlyPublished ? eq(assessments.status, "PUBLISHED") : undefined)
    .orderBy(desc(assessments.createdAt));

  if (rows.length === 0) {
    return [];
  }

  const links = await db
    .select({ assessmentId: assessmentSkills.assessmentId, skillName: skills.name })
    .from(assessmentSkills)
    .innerJoin(skills, eq(assessmentSkills.skillId, skills.id))
    .where(
      inArray(
        assessmentSkills.assessmentId,
        rows.map((row) => row.id),
      ),
    );

  const bySkill = new Map<string, string[]>();

  for (const link of links) {
    bySkill.set(link.assessmentId, [...(bySkill.get(link.assessmentId) ?? []), link.skillName]);
  }

  return rows.map((row) => ({ ...row, skillNames: bySkill.get(row.id) ?? [] }));
}

/** Full assessment with its rubric, resources and linked skills. */
export async function getAssessmentDetail(assessmentId: string) {
  const [assessment] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);

  if (!assessment) {
    return null;
  }

  const [criteria, resources, linkedSkills] = await Promise.all([
    db
      .select()
      .from(rubricCriteria)
      .where(eq(rubricCriteria.assessmentId, assessmentId))
      .orderBy(asc(rubricCriteria.displayOrder), asc(rubricCriteria.createdAt)),

    db
      .select()
      .from(assessmentResources)
      .where(eq(assessmentResources.assessmentId, assessmentId))
      .orderBy(asc(assessmentResources.displayOrder)),

    db
      .select({ id: skills.id, name: skills.name })
      .from(assessmentSkills)
      .innerJoin(skills, eq(assessmentSkills.skillId, skills.id))
      .where(eq(assessmentSkills.assessmentId, assessmentId)),
  ]);

  return { assessment, criteria, resources, skills: linkedSkills };
}

export type PendingVerificationRequest = {
  requestId: string;
  candidateSkillId: string;
  candidateId: string;
  candidateName: string;
  skillId: string;
  skillName: string;
  experienceLevel: string;
  requestedAt: Date;
};

/** Verification requests waiting for an assessment to be assigned. */
export async function getPendingVerificationRequests(): Promise<PendingVerificationRequest[]> {
  return db
    .select({
      requestId: verificationRequests.id,
      candidateSkillId: verificationRequests.candidateSkillId,
      candidateId: verificationRequests.candidateId,
      candidateName: candidateProfiles.fullName,
      skillId: candidateSkills.skillId,
      skillName: skills.name,
      experienceLevel: candidateSkills.experienceLevel,
      requestedAt: verificationRequests.requestedAt,
    })
    .from(verificationRequests)
    .innerJoin(candidateProfiles, eq(verificationRequests.candidateId, candidateProfiles.id))
    .innerJoin(candidateSkills, eq(verificationRequests.candidateSkillId, candidateSkills.id))
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .where(eq(verificationRequests.status, "PENDING"))
    .orderBy(asc(verificationRequests.requestedAt));
}

/** Published assessments that verify a given skill. */
export async function getAssessmentsForSkill(skillId: string) {
  return db
    .select({ id: assessments.id, title: assessments.title, difficulty: assessments.difficulty })
    .from(assessments)
    .innerJoin(assessmentSkills, eq(assessmentSkills.assessmentId, assessments.id))
    .where(and(eq(assessmentSkills.skillId, skillId), eq(assessments.status, "PUBLISHED")))
    .orderBy(asc(assessments.title));
}

/** Everyone holding the reviewer role, for assignment dropdowns. */
export async function getReviewerOptions() {
  return db
    .select({ id: users.id, email: users.email })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(users, eq(userRoles.userId, users.id))
    .where(eq(roles.name, "REVIEWER"))
    .orderBy(asc(users.email));
}

export type CandidateAssignment = {
  assignmentId: string;
  assessmentId: string;
  title: string;
  difficulty: string;
  status: string;
  deadline: Date;
  maxAttempts: number;
  skillName: string;
  candidateSkillId: string;
  attemptsUsed: number;
  latestSubmissionId: string | null;
  latestSubmissionStatus: string | null;
  /** Resolved here so components stay pure and never read the clock mid-render. */
  isOverdue: boolean;
};

/** Assessments assigned to a candidate, with attempt usage. */
export async function getCandidateAssignments(candidateId: string): Promise<CandidateAssignment[]> {
  const rows = await db
    .select({
      assignmentId: assessmentAssignments.id,
      assessmentId: assessments.id,
      title: assessments.title,
      difficulty: assessments.difficulty,
      status: assessmentAssignments.status,
      deadline: assessmentAssignments.deadline,
      maxAttempts: assessmentAssignments.maxAttempts,
      skillName: skills.name,
      candidateSkillId: assessmentAssignments.candidateSkillId,
    })
    .from(assessmentAssignments)
    .innerJoin(assessments, eq(assessmentAssignments.assessmentId, assessments.id))
    .innerJoin(candidateSkills, eq(assessmentAssignments.candidateSkillId, candidateSkills.id))
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .where(eq(candidateSkills.candidateId, candidateId))
    .orderBy(asc(assessmentAssignments.deadline));

  if (rows.length === 0) {
    return [];
  }

  const subs = await db
    .select({
      assignmentId: submissions.assignmentId,
      id: submissions.id,
      status: submissions.status,
      attemptNumber: submissions.attemptNumber,
    })
    .from(submissions)
    .where(
      inArray(
        submissions.assignmentId,
        rows.map((row) => row.assignmentId),
      ),
    )
    .orderBy(desc(submissions.attemptNumber));

  const byAssignment = new Map<string, typeof subs>();

  for (const sub of subs) {
    byAssignment.set(sub.assignmentId, [...(byAssignment.get(sub.assignmentId) ?? []), sub]);
  }

  const now = Date.now();

  return rows.map((row) => {
    const list = byAssignment.get(row.assignmentId) ?? [];
    const latest = list[0];

    return {
      ...row,
      attemptsUsed: list.length,
      latestSubmissionId: latest?.id ?? null,
      latestSubmissionStatus: latest?.status ?? null,
      isOverdue: row.deadline.getTime() < now,
    };
  });
}

/** A single assignment, scoped to its owning candidate. */
export async function getAssignmentForCandidate(assignmentId: string, candidateId: string) {
  const [row] = await db
    .select({
      assignmentId: assessmentAssignments.id,
      assessmentId: assessmentAssignments.assessmentId,
      status: assessmentAssignments.status,
      deadline: assessmentAssignments.deadline,
      maxAttempts: assessmentAssignments.maxAttempts,
      startedAt: assessmentAssignments.startedAt,
      candidateSkillId: assessmentAssignments.candidateSkillId,
      skillName: skills.name,
    })
    .from(assessmentAssignments)
    .innerJoin(candidateSkills, eq(assessmentAssignments.candidateSkillId, candidateSkills.id))
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .where(
      and(eq(assessmentAssignments.id, assignmentId), eq(candidateSkills.candidateId, candidateId)),
    )
    .limit(1);

  return row ? { ...row, deadlinePassed: row.deadline.getTime() < Date.now() } : null;
}

/** Submissions made against an assignment, newest attempt first. */
export async function getSubmissionsForAssignment(assignmentId: string) {
  const rows = await db
    .select()
    .from(submissions)
    .where(eq(submissions.assignmentId, assignmentId))
    .orderBy(desc(submissions.attemptNumber));

  if (rows.length === 0) {
    return [];
  }

  const evidence = await db
    .select()
    .from(submissionEvidence)
    .where(
      inArray(
        submissionEvidence.submissionId,
        rows.map((row) => row.id),
      ),
    );

  const reviewRows = await db
    .select()
    .from(reviews)
    .where(
      inArray(
        reviews.submissionId,
        rows.map((row) => row.id),
      ),
    );

  return rows.map((row) => ({
    ...row,
    evidence: evidence.filter((item) => item.submissionId === row.id),
    review: reviewRows.find((item) => item.submissionId === row.id) ?? null,
  }));
}
