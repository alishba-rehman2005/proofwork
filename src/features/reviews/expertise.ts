import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { reviewerSkills, roles, skillCategories, skills, userRoles, users } from "@/db/schema";

/*
|--------------------------------------------------------------------------
| REVIEWER EXPERTISE
|--------------------------------------------------------------------------
| A reviewer may only verify skills an admin has granted them. Without this
| any reviewer could approve any submission, and a Verified badge would say
| nothing about whether the person judging the work understood it.
|
| Admins are exempt: they are the ones granting the rights in the first place.
*/

export type ReviewerGrant = {
  id: string;
  skillId: string;
  skillName: string;
  categoryName: string | null;
  canVerify: boolean;
};

/** Skills a reviewer is authorised to verify. */
export async function getReviewerExpertise(reviewerId: string): Promise<ReviewerGrant[]> {
  return db
    .select({
      id: reviewerSkills.id,
      skillId: reviewerSkills.skillId,
      skillName: skills.name,
      categoryName: skillCategories.name,
      canVerify: reviewerSkills.canVerify,
    })
    .from(reviewerSkills)
    .innerJoin(skills, eq(reviewerSkills.skillId, skills.id))
    .leftJoin(skillCategories, eq(skills.categoryId, skillCategories.id))
    .where(eq(reviewerSkills.reviewerId, reviewerId))
    .orderBy(asc(skills.name));
}

/** Skill ids a reviewer may verify, for filtering the queue. */
export async function getVerifiableSkillIds(reviewerId: string): Promise<string[]> {
  const rows = await db
    .select({ skillId: reviewerSkills.skillId })
    .from(reviewerSkills)
    .where(and(eq(reviewerSkills.reviewerId, reviewerId), eq(reviewerSkills.canVerify, true)));

  return rows.map((row) => row.skillId);
}

/** True when this reviewer holds an active grant for the skill. */
export async function canReviewerVerify(reviewerId: string, skillId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: reviewerSkills.id })
    .from(reviewerSkills)
    .where(
      and(
        eq(reviewerSkills.reviewerId, reviewerId),
        eq(reviewerSkills.skillId, skillId),
        eq(reviewerSkills.canVerify, true),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export type ReviewerWithExpertise = {
  userId: string;
  email: string;
  name: string | null;
  grants: ReviewerGrant[];
};

/** Every reviewer with the skills they are cleared to verify, for the admin. */
export async function getReviewersWithExpertise(): Promise<ReviewerWithExpertise[]> {
  const reviewers = await db
    .select({ userId: users.id, email: users.email, name: users.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(users, eq(userRoles.userId, users.id))
    .where(eq(roles.name, "REVIEWER"))
    .orderBy(asc(users.email));

  if (reviewers.length === 0) {
    return [];
  }

  const grants = await db
    .select({
      id: reviewerSkills.id,
      reviewerId: reviewerSkills.reviewerId,
      skillId: reviewerSkills.skillId,
      skillName: skills.name,
      categoryName: skillCategories.name,
      canVerify: reviewerSkills.canVerify,
    })
    .from(reviewerSkills)
    .innerJoin(skills, eq(reviewerSkills.skillId, skills.id))
    .leftJoin(skillCategories, eq(skills.categoryId, skillCategories.id))
    .orderBy(asc(skills.name));

  return reviewers.map((reviewer) => ({
    ...reviewer,
    grants: grants
      .filter((grant) => grant.reviewerId === reviewer.userId)
      .map((grant) => ({
        id: grant.id,
        skillId: grant.skillId,
        skillName: grant.skillName,
        categoryName: grant.categoryName,
        canVerify: grant.canVerify,
      })),
  }));
}
