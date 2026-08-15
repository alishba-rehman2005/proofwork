import { and, desc, eq, gte, ilike, inArray, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { candidateProfiles, candidateSkills, skills } from "@/db/schema";

export type CandidateSearchFilters = {
  skillId?: string;
  verifiedOnly?: boolean;
  minScore?: number;
  location?: string;
  availability?: string;
  experienceLevel?: string;
};

export type CandidateSearchResult = {
  candidateId: string;
  fullName: string;
  slug: string;
  headline: string | null;
  city: string | null;
  country: string | null;
  availability: string | null;
  profileImageUrl: string | null;
  verifiedSkills: { name: string; score: number | null; level: string }[];
  topScore: number;
};

/**
 * Finds candidates a recruiter is allowed to see.
 *
 * Only PUBLIC and RECRUITERS_ONLY profiles are searchable; a candidate who set
 * their profile to PRIVATE is excluded entirely rather than shown with hidden
 * details.
 */
export async function searchCandidates(
  filters: CandidateSearchFilters,
): Promise<CandidateSearchResult[]> {
  const conditions: SQL[] = [
    or(
      eq(candidateProfiles.profileVisibility, "PUBLIC"),
      eq(candidateProfiles.profileVisibility, "RECRUITERS_ONLY"),
    )!,
  ];

  if (filters.location) {
    conditions.push(
      or(
        ilike(candidateProfiles.city, `%${filters.location}%`),
        ilike(candidateProfiles.country, `%${filters.location}%`),
        ilike(candidateProfiles.location, `%${filters.location}%`),
      )!,
    );
  }

  if (filters.availability) {
    conditions.push(
      eq(
        candidateProfiles.availability,
        filters.availability as "AVAILABLE" | "OPEN_TO_OPPORTUNITIES" | "NOT_AVAILABLE",
      ),
    );
  }

  const profiles = await db
    .select({
      candidateId: candidateProfiles.id,
      fullName: candidateProfiles.fullName,
      slug: candidateProfiles.slug,
      headline: candidateProfiles.headline,
      city: candidateProfiles.city,
      country: candidateProfiles.country,
      availability: candidateProfiles.availability,
      profileImageUrl: candidateProfiles.profileImageUrl,
    })
    .from(candidateProfiles)
    .where(and(...conditions));

  if (profiles.length === 0) {
    return [];
  }

  const skillConditions: SQL[] = [
    inArray(
      candidateSkills.candidateId,
      profiles.map((profile) => profile.candidateId),
    ),
  ];

  if (filters.verifiedOnly !== false) {
    skillConditions.push(eq(candidateSkills.verificationStatus, "VERIFIED"));
  }

  if (filters.skillId) {
    skillConditions.push(eq(candidateSkills.skillId, filters.skillId));
  }

  if (filters.experienceLevel) {
    skillConditions.push(
      eq(
        candidateSkills.experienceLevel,
        filters.experienceLevel as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT",
      ),
    );
  }

  if (typeof filters.minScore === "number" && filters.minScore > 0) {
    skillConditions.push(gte(candidateSkills.currentScore, String(filters.minScore)));
  }

  const skillRows = await db
    .select({
      candidateId: candidateSkills.candidateId,
      name: skills.name,
      score: candidateSkills.currentScore,
      level: candidateSkills.experienceLevel,
      status: candidateSkills.verificationStatus,
    })
    .from(candidateSkills)
    .innerJoin(skills, eq(candidateSkills.skillId, skills.id))
    .where(and(...skillConditions))
    .orderBy(desc(candidateSkills.currentScore));

  const matchedCandidates = new Set(skillRows.map((row) => row.candidateId));

  // Any active filter narrows the result set to candidates who actually match;
  // with no filters every visible profile is listed.
  const filtering = Boolean(
    filters.skillId ||
    filters.experienceLevel ||
    (filters.minScore ?? 0) > 0 ||
    filters.verifiedOnly !== false,
  );

  return profiles
    .filter((profile) => !filtering || matchedCandidates.has(profile.candidateId))
    .map((profile) => {
      const owned = skillRows.filter((row) => row.candidateId === profile.candidateId);

      return {
        ...profile,
        verifiedSkills: owned.map((row) => ({
          name: row.name,
          score: row.score ? Number(row.score) : null,
          level: row.level,
        })),
        topScore: owned.reduce((max, row) => Math.max(max, Number(row.score ?? 0)), 0),
      };
    })
    .sort((a, b) => b.topScore - a.topScore || a.fullName.localeCompare(b.fullName));
}
