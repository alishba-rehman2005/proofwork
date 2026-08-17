import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  activityEvents,
  assessmentAssignments,
  assessments,
  candidateSkills,
  projects,
  reviews,
  skillCategories,
  skills,
  submissions,
  teamContributions,
  teamMembers,
} from "@/db/schema";

/*
|--------------------------------------------------------------------------
| CANDIDATE OVERVIEW
|--------------------------------------------------------------------------
| Aggregates for the dashboard and skills pages. Everything here is derived
| from records the platform actually holds - there are no illustrative
| figures, so a candidate with no history sees zeroes rather than a demo.
*/

function startOfMonth(): Date {
  const now = new Date();

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export type CandidateOverview = {
  /** Mean score across verified skills. Null until something is verified. */
  trustScore: number | null;
  verifiedSkills: number;
  verifiedSkillsThisMonth: number;
  pendingReview: number;
  totalAssessments: number;
  completedAssessments: number;
  assessmentsThisMonth: number;
  openAssessments: number;
  teamContributions: number;
  verifiedContributions: number;
};

export async function getCandidateOverview(
  candidateId: string,
  userId: string,
): Promise<CandidateOverview> {
  const monthStart = startOfMonth();

  const [skillRows, assignmentRows, contributionRows] = await Promise.all([
    db
      .select({
        status: candidateSkills.verificationStatus,
        score: candidateSkills.currentScore,
        verifiedAt: candidateSkills.verifiedAt,
      })
      .from(candidateSkills)
      .where(eq(candidateSkills.candidateId, candidateId)),

    db
      .select({
        status: assessmentAssignments.status,
        completedAt: assessmentAssignments.completedAt,
      })
      .from(assessmentAssignments)
      .innerJoin(candidateSkills, eq(assessmentAssignments.candidateSkillId, candidateSkills.id))
      .where(eq(candidateSkills.candidateId, candidateId)),

    db
      .select({ status: teamContributions.verificationStatus })
      .from(teamContributions)
      .innerJoin(teamMembers, eq(teamContributions.teamMemberId, teamMembers.id))
      .where(eq(teamMembers.userId, userId)),
  ]);

  const verified = skillRows.filter((row) => row.status === "VERIFIED");

  const scores = verified
    .map((row) => Number(row.score))
    .filter((score) => Number.isFinite(score) && score > 0);

  const openStatuses = [
    "ASSIGNED",
    "IN_PROGRESS",
    "CHANGES_REQUESTED",
    "SUBMITTED",
    "UNDER_REVIEW",
  ];

  return {
    trustScore:
      scores.length > 0
        ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
        : null,
    verifiedSkills: verified.length,
    verifiedSkillsThisMonth: verified.filter(
      (row) => row.verifiedAt && row.verifiedAt >= monthStart,
    ).length,
    pendingReview: skillRows.filter((row) => ["SUBMITTED", "UNDER_REVIEW"].includes(row.status))
      .length,
    totalAssessments: assignmentRows.length,
    completedAssessments: assignmentRows.filter((row) => row.status === "APPROVED").length,
    assessmentsThisMonth: assignmentRows.filter(
      (row) => row.completedAt && row.completedAt >= monthStart,
    ).length,
    openAssessments: assignmentRows.filter((row) => openStatuses.includes(row.status)).length,
    teamContributions: contributionRows.length,
    verifiedContributions: contributionRows.filter((row) => row.status === "VERIFIED").length,
  };
}

export type SkillScoreRow = {
  id: string;
  skillName: string;
  categoryName: string | null;
  status: string;
  score: number | null;
  experienceLevel: string;
};

/** Skill scores for the verification overview, strongest first. */
export async function getSkillScores(candidateId: string, limit = 6): Promise<SkillScoreRow[]> {
  const rows = await db
    .select({
      id: candidateSkills.id,
      skillName: skills.name,
      categoryName: skillCategories.name,
      status: candidateSkills.verificationStatus,
      score: candidateSkills.currentScore,
      experienceLevel: candidateSkills.experienceLevel,
    })
    .from(candidateSkills)
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .leftJoin(skillCategories, eq(skills.categoryId, skillCategories.id))
    .where(eq(candidateSkills.candidateId, candidateId))
    .orderBy(desc(candidateSkills.currentScore));

  // Verified skills lead, then work in flight, then untouched ones.
  const rank = (status: string) =>
    status === "VERIFIED" ? 0 : status === "UNVERIFIED" || status === "REJECTED" ? 2 : 1;

  return rows
    .map((row) => ({ ...row, score: row.score === null ? null : Number(row.score) }))
    .sort((a, b) => rank(a.status) - rank(b.status) || (b.score ?? -1) - (a.score ?? -1))
    .slice(0, limit);
}

export type PastAssessment = {
  submissionId: string;
  assessmentTitle: string;
  skillName: string;
  totalScore: number;
  maximumScore: number;
  percentage: number;
  outcome: string;
  reviewedAt: Date;
  candidateFeedback: string;
};

/** Reviewed assessments, newest first, with the reviewer's written verdict. */
export async function getPastAssessments(
  candidateId: string,
  limit = 6,
): Promise<PastAssessment[]> {
  const rows = await db
    .select({
      submissionId: submissions.id,
      assessmentTitle: assessments.title,
      skillName: skills.name,
      totalScore: reviews.totalScore,
      maximumScore: assessments.maximumScore,
      outcome: reviews.outcome,
      reviewedAt: reviews.reviewedAt,
      candidateFeedback: reviews.candidateFeedback,
    })
    .from(reviews)
    .innerJoin(submissions, eq(reviews.submissionId, submissions.id))
    .innerJoin(assessmentAssignments, eq(submissions.assignmentId, assessmentAssignments.id))
    .innerJoin(assessments, eq(assessmentAssignments.assessmentId, assessments.id))
    .innerJoin(candidateSkills, eq(assessmentAssignments.candidateSkillId, candidateSkills.id))
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .where(eq(candidateSkills.candidateId, candidateId))
    .orderBy(desc(reviews.reviewedAt))
    .limit(limit);

  return rows.map((row) => {
    const total = Number(row.totalScore);

    return {
      ...row,
      totalScore: total,
      percentage: row.maximumScore > 0 ? Math.round((total / row.maximumScore) * 100) : 0,
    };
  });
}

export type NextAssessment = {
  assignmentId: string;
  title: string;
  skillName: string;
  difficulty: string;
  status: string;
  deadline: Date;
  estimatedDurationMinutes: number | null;
};

/** The most urgent open assessment, used for the call-to-action banner. */
export async function getNextAssessment(candidateId: string): Promise<NextAssessment | null> {
  const [row] = await db
    .select({
      assignmentId: assessmentAssignments.id,
      title: assessments.title,
      skillName: skills.name,
      difficulty: assessments.difficulty,
      status: assessmentAssignments.status,
      deadline: assessmentAssignments.deadline,
      estimatedDurationMinutes: assessments.estimatedDurationMinutes,
    })
    .from(assessmentAssignments)
    .innerJoin(assessments, eq(assessmentAssignments.assessmentId, assessments.id))
    .innerJoin(candidateSkills, eq(assessmentAssignments.candidateSkillId, candidateSkills.id))
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .where(
      and(
        eq(candidateSkills.candidateId, candidateId),
        inArray(assessmentAssignments.status, ["ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED"]),
      ),
    )
    .orderBy(assessmentAssignments.deadline)
    .limit(1);

  return row ?? null;
}

export type ActivityDay = { date: string; count: number };

/**
 * Daily activity counts for the contribution grid.
 *
 * Returns a dense series including empty days, so the grid can be rendered
 * without the caller filling gaps.
 */
export async function getActivityCalendar(candidateId: string, days = 70): Promise<ActivityDay[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      day: sql<string>`to_char(${activityEvents.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(activityEvents)
    .where(and(eq(activityEvents.candidateId, candidateId), gte(activityEvents.createdAt, since)))
    .groupBy(sql`1`);

  const counts = new Map(rows.map((row) => [row.day, row.count]));
  const series: ActivityDay[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);

    series.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return series;
}

/** Verified projects with their technology tags, for the portfolio strip. */
export async function getPortfolioHighlights(candidateId: string, limit = 4) {
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      githubUrl: projects.githubUrl,
      liveUrl: projects.liveUrl,
      verificationStatus: projects.verificationStatus,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.candidateId, candidateId))
    .orderBy(desc(projects.updatedAt))
    .limit(limit);

  if (rows.length === 0) {
    return [];
  }

  const tags = await db
    .select({ projectId: sql<string>`project_skills.project_id`, name: skills.name })
    .from(sql`project_skills`)
    .innerJoin(skills, sql`project_skills.skill_id = ${skills.id}`)
    .where(
      inArray(
        sql`project_skills.project_id`,
        rows.map((row) => row.id),
      ),
    );

  return rows.map((row) => ({
    ...row,
    skillNames: tags.filter((tag) => tag.projectId === row.id).map((tag) => tag.name),
  }));
}
