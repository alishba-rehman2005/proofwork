import { asc, desc, eq, sql, type AnyColumn, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { candidateProfiles, education, experience, socialLinks } from "@/db/schema";

import type { CandidateProfile, CandidateProfileWithRelations } from "../types";

/**
 * Newest entries first, the way a CV reads.
 *
 * NULLS LAST is explicit because Postgres orders nulls first on DESC, which
 * would float undated entries above real ones.
 */
function newestFirst(column: AnyColumn): SQL {
  return sql`${column} DESC NULLS LAST`;
}

async function loadRelations(candidateId: string) {
  const [educationItems, experienceItems, socialItems] = await Promise.all([
    db
      .select()
      .from(education)
      .where(eq(education.candidateId, candidateId))
      .orderBy(newestFirst(education.startDate), desc(education.createdAt)),

    db
      .select()
      .from(experience)
      .where(eq(experience.candidateId, candidateId))
      .orderBy(newestFirst(experience.startDate), desc(experience.createdAt)),

    db
      .select()
      .from(socialLinks)
      .where(eq(socialLinks.candidateId, candidateId))
      .orderBy(asc(socialLinks.createdAt)),
  ]);

  return {
    education: educationItems,
    experience: experienceItems,
    socialLinks: socialItems,
  };
}

function withRelations(
  profile: CandidateProfile,
  relations: Awaited<ReturnType<typeof loadRelations>>,
): CandidateProfileWithRelations {
  return { ...profile, ...relations };
}

/**
 * Loads a candidate profile with its related sections.
 *
 * Returns null when the user has no candidate profile, which lets callers
 * decide between a redirect and a 404 rather than throwing here.
 */
export async function getCandidateProfileByUserId(
  userId: string,
): Promise<CandidateProfileWithRelations | null> {
  const [profile] = await db
    .select()
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    return null;
  }

  return withRelations(profile, await loadRelations(profile.id));
}

/**
 * Loads a candidate profile by its public slug.
 *
 * Performs no access control: callers must check `canViewProfile` before
 * rendering anything, so that visibility rules live in one place.
 */
export async function getCandidateProfileBySlug(
  slug: string,
): Promise<CandidateProfileWithRelations | null> {
  const [profile] = await db
    .select()
    .from(candidateProfiles)
    .where(eq(candidateProfiles.slug, slug))
    .limit(1);

  if (!profile) {
    return null;
  }

  return withRelations(profile, await loadRelations(profile.id));
}
