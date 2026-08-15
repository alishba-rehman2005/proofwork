import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  activityEvents,
  candidateProfiles,
  candidateSkills,
  notifications,
  projects,
  skillCategories,
  skills,
} from "@/db/schema";

export type LeaderboardRow = {
  candidateId: string;
  fullName: string;
  slug: string;
  headline: string | null;
  profileImageUrl: string | null;
  verifiedSkills: number;
  averageScore: number;
  verifiedProjects: number;
};

/**
 * Ranks candidates on proven work.
 *
 * Deliberately built from verified skills and reviewed scores rather than
 * activity volume, so the board rewards demonstrated ability instead of
 * whoever clicks the most.
 */
export async function getLeaderboard(limit = 25, categorySlug?: string): Promise<LeaderboardRow[]> {
  const skillRows = await db
    .select({
      candidateId: candidateSkills.candidateId,
      total: sql<number>`count(*)::int`,
      average: sql<number>`coalesce(avg(${candidateSkills.currentScore}), 0)::float`,
    })
    .from(candidateSkills)
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .leftJoin(skillCategories, eq(skills.categoryId, skillCategories.id))
    .where(
      categorySlug
        ? and(
            eq(candidateSkills.verificationStatus, "VERIFIED"),
            eq(skillCategories.slug, categorySlug),
          )
        : eq(candidateSkills.verificationStatus, "VERIFIED"),
    )
    .groupBy(candidateSkills.candidateId);

  if (skillRows.length === 0) {
    return [];
  }

  const projectRows = await db
    .select({
      candidateId: projects.candidateId,
      total: sql<number>`count(*)::int`,
    })
    .from(projects)
    .where(eq(projects.verificationStatus, "VERIFIED"))
    .groupBy(projects.candidateId);

  const projectCounts = new Map(
    projectRows.filter((row) => row.candidateId).map((row) => [row.candidateId!, row.total]),
  );

  const profiles = await db
    .select({
      candidateId: candidateProfiles.id,
      fullName: candidateProfiles.fullName,
      slug: candidateProfiles.slug,
      headline: candidateProfiles.headline,
      profileImageUrl: candidateProfiles.profileImageUrl,
      visibility: candidateProfiles.profileVisibility,
    })
    .from(candidateProfiles);

  const byId = new Map(profiles.map((profile) => [profile.candidateId, profile]));

  return skillRows
    .map((row) => {
      const profile = byId.get(row.candidateId);

      if (!profile || profile.visibility === "PRIVATE") {
        return null;
      }

      return {
        candidateId: row.candidateId,
        fullName: profile.fullName,
        slug: profile.slug,
        headline: profile.headline,
        profileImageUrl: profile.profileImageUrl,
        verifiedSkills: row.total,
        averageScore: Math.round(row.average),
        verifiedProjects: projectCounts.get(row.candidateId) ?? 0,
      };
    })
    .filter((row): row is LeaderboardRow => row !== null)
    .sort(
      (a, b) =>
        b.verifiedSkills - a.verifiedSkills ||
        b.averageScore - a.averageScore ||
        a.fullName.localeCompare(b.fullName),
    )
    .slice(0, limit);
}

/** Recent activity for a candidate's own feed. */
export async function getActivityFeed(candidateId: string, limit = 20) {
  return db
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.candidateId, candidateId))
    .orderBy(desc(activityEvents.createdAt))
    .limit(limit);
}

/** Notifications for a user, newest first. */
export async function getNotifications(userId: string, limit = 50) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return row?.total ?? 0;
}

export type ActiveCandidateRow = {
  candidateId: string;
  fullName: string;
  slug: string;
  events: number;
};

/**
 * Most active candidates by recorded activity.
 *
 * Kept separate from the main board on purpose: activity measures effort, not
 * proven ability, and blending the two would let volume outrank evidence.
 */
export async function getMostActiveCandidates(limit = 10): Promise<ActiveCandidateRow[]> {
  const rows = await db
    .select({
      candidateId: activityEvents.candidateId,
      events: sql<number>`count(*)::int`,
    })
    .from(activityEvents)
    .groupBy(activityEvents.candidateId);

  if (rows.length === 0) {
    return [];
  }

  const profiles = await db
    .select({
      candidateId: candidateProfiles.id,
      fullName: candidateProfiles.fullName,
      slug: candidateProfiles.slug,
      visibility: candidateProfiles.profileVisibility,
    })
    .from(candidateProfiles);

  const byId = new Map(profiles.map((profile) => [profile.candidateId, profile]));

  return rows
    .map((row) => {
      const profile = byId.get(row.candidateId);

      if (!profile || profile.visibility === "PRIVATE") {
        return null;
      }

      return {
        candidateId: row.candidateId,
        fullName: profile.fullName,
        slug: profile.slug,
        events: row.events,
      };
    })
    .filter((row): row is ActiveCandidateRow => row !== null)
    .sort((a, b) => b.events - a.events)
    .slice(0, limit);
}

/** Skill categories that currently have at least one verified skill. */
export async function getLeaderboardCategories() {
  const rows = await db
    .selectDistinct({ name: skillCategories.name, slug: skillCategories.slug })
    .from(candidateSkills)
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .innerJoin(skillCategories, eq(skills.categoryId, skillCategories.id))
    .where(eq(candidateSkills.verificationStatus, "VERIFIED"));

  return rows;
}
