import { sql } from "drizzle-orm";

import { db } from "@/db";
import { assessmentAssignments, candidateProfiles, candidateSkills, projects } from "@/db/schema";

export type PublicStats = {
  verifiedSkills: number;
  reviewedAssessments: number;
  verifiedProjects: number;
  candidates: number;
};

/**
 * Headline numbers for the landing page.
 *
 * Real counts, not marketing figures - the strip stays honest while the
 * platform is small, and grows on its own. One round trip of scalar
 * subqueries, matching `getPlatformStats`, so a public page never holds four
 * pooled connections just to render a row of numbers.
 */
export async function getPublicStats(): Promise<PublicStats> {
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*) FROM ${candidateSkills}
        WHERE ${candidateSkills.verificationStatus} = 'VERIFIED')::int AS verified_skills,
      (SELECT count(*) FROM ${assessmentAssignments}
        WHERE ${assessmentAssignments.status} = 'APPROVED')::int AS reviewed_assessments,
      (SELECT count(*) FROM ${projects}
        WHERE ${projects.verificationStatus} = 'VERIFIED')::int AS verified_projects,
      (SELECT count(*) FROM ${candidateProfiles})::int AS candidates
  `);

  const row = (result as unknown as Record<string, number>[])[0] ?? {};

  return {
    verifiedSkills: Number(row.verified_skills ?? 0),
    reviewedAssessments: Number(row.reviewed_assessments ?? 0),
    verifiedProjects: Number(row.verified_projects ?? 0),
    candidates: Number(row.candidates ?? 0),
  };
}
