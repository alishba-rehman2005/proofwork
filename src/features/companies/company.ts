import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { companies, companyMembers, users } from "@/db/schema";

/*
|--------------------------------------------------------------------------
| COMPANY
|--------------------------------------------------------------------------
| The recruiter-side counterpart to a candidate profile. A company is created
| at signup and approved by an admin; this is where it is maintained.
*/

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || z.url({ protocol: /^https?$/ }).safeParse(value).success,
    "Enter a valid http(s) URL.",
  )
  .transform((value) => (value === "" ? null : value));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must not exceed ${max} characters.`)
    .transform((value) => (value === "" ? null : value));

export const companySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters.")
    .max(150, "Company name must not exceed 150 characters."),
  description: optionalText(2000),
  website: optionalUrl,
  logoUrl: optionalUrl,
  industry: optionalText(100),
  location: optionalText(150),
});

export const inviteColleagueSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  jobTitle: optionalText(100),
});

export type CompanyMemberRow = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  jobTitle: string | null;
  membershipRole: string;
  isMe: boolean;
};

export type CompanyDetails = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  industry: string | null;
  location: string | null;
  status: string;
  membershipRole: string;
  isOwner: boolean;
  members: CompanyMemberRow[];
};

/**
 * The company the signed-in recruiter belongs to.
 *
 * Returns null when the account has no membership, which the page turns into
 * an explanation rather than a crash.
 */
export async function getCompanyForUser(userId: string): Promise<CompanyDetails | null> {
  const [membership] = await db
    .select({
      companyId: companyMembers.companyId,
      membershipRole: companyMembers.membershipRole,
    })
    .from(companyMembers)
    .where(eq(companyMembers.userId, userId))
    .limit(1);

  if (!membership) {
    return null;
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, membership.companyId))
    .limit(1);

  if (!company) {
    return null;
  }

  const memberRows = await db
    .select({
      id: companyMembers.id,
      userId: companyMembers.userId,
      email: users.email,
      name: users.name,
      jobTitle: companyMembers.jobTitle,
      membershipRole: companyMembers.membershipRole,
    })
    .from(companyMembers)
    .innerJoin(users, eq(companyMembers.userId, users.id))
    .where(eq(companyMembers.companyId, company.id))
    .orderBy(asc(companyMembers.createdAt));

  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    description: company.description,
    website: company.website,
    logoUrl: company.logoUrl,
    industry: company.industry,
    location: company.location,
    status: company.status,
    membershipRole: membership.membershipRole,
    isOwner: membership.membershipRole === "OWNER",
    members: memberRows.map((row) => ({ ...row, isMe: row.userId === userId })),
  };
}
