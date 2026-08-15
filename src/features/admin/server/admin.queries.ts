import { asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  assessmentAssignments,
  candidateSkills,
  companies,
  companyMembers,
  projects,
  roles,
  skillRequests,
  skills,
  userRoles,
  users,
} from "@/db/schema";

export type PendingCompany = {
  companyId: string;
  companyName: string;
  website: string | null;
  ownerUserId: string;
  ownerEmail: string;
  ownerJobTitle: string | null;
  requestedAt: Date;
};

/**
 * Company accounts awaiting review, oldest first so the queue is fair.
 */
export async function getPendingCompanies(): Promise<PendingCompany[]> {
  return db
    .select({
      companyId: companies.id,
      companyName: companies.name,
      website: companies.website,
      ownerUserId: users.id,
      ownerEmail: users.email,
      ownerJobTitle: companyMembers.jobTitle,
      requestedAt: companies.createdAt,
    })
    .from(companies)
    .innerJoin(users, eq(companies.createdById, users.id))
    .leftJoin(companyMembers, eq(companyMembers.companyId, companies.id))
    .where(eq(companies.status, "PENDING"))
    .orderBy(asc(companies.createdAt));
}

export type ReviewerSummary = {
  userId: string;
  email: string;
  appointedAt: Date;
};

/** Users currently holding the reviewer role. */
export async function getReviewers(): Promise<ReviewerSummary[]> {
  return db
    .select({
      userId: users.id,
      email: users.email,
      appointedAt: userRoles.createdAt,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(users, eq(userRoles.userId, users.id))
    .where(eq(roles.name, "REVIEWER"))
    .orderBy(asc(userRoles.createdAt));
}

export type PlatformStats = {
  totalUsers: number;
  activeCandidates: number;
  pendingCompanies: number;
  reviewers: number;
  skillsVerified: number;
  assessmentsCompleted: number;
  projectsSubmitted: number;
  companiesRegistered: number;
};

/**
 * Counts for the admin overview.
 *
 * Deliberately small: the fuller analytics in the brief depend on assessments
 * and submissions, which do not exist yet.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const [
    allUsers,
    candidateRows,
    pending,
    reviewerRows,
    verifiedSkillRows,
    completedRows,
    projectRows,
    companyRows,
  ] = await Promise.all([
    db.select({ id: users.id }).from(users),

    db
      .select({ id: userRoles.userId })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(eq(roles.name, "CANDIDATE")),

    db.select({ id: companies.id }).from(companies).where(eq(companies.status, "PENDING")),

    db
      .select({ id: userRoles.userId })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(roles.name, "REVIEWER")),

    db
      .select({ id: candidateSkills.id })
      .from(candidateSkills)
      .where(eq(candidateSkills.verificationStatus, "VERIFIED")),

    db
      .select({ id: assessmentAssignments.id })
      .from(assessmentAssignments)
      .where(eq(assessmentAssignments.status, "APPROVED")),

    db.select({ id: projects.id }).from(projects),

    db.select({ id: companies.id }).from(companies),
  ]);

  return {
    totalUsers: allUsers.length,
    activeCandidates: candidateRows.length,
    pendingCompanies: pending.length,
    reviewers: reviewerRows.length,
    skillsVerified: verifiedSkillRows.length,
    assessmentsCompleted: completedRows.length,
    projectsSubmitted: projectRows.length,
    companiesRegistered: companyRows.length,
  };
}

export type SkillRequestRow = {
  id: string;
  proposedName: string;
  description: string | null;
  requestedBy: string;
  createdAt: Date;
};

/** Candidate suggestions for skills missing from the catalogue. */
export async function getPendingSkillRequests(): Promise<SkillRequestRow[]> {
  return db
    .select({
      id: skillRequests.id,
      proposedName: skillRequests.proposedName,
      description: skillRequests.description,
      requestedBy: users.email,
      createdAt: skillRequests.createdAt,
    })
    .from(skillRequests)
    .innerJoin(users, eq(skillRequests.requestedById, users.id))
    .where(eq(skillRequests.status, "PENDING"))
    .orderBy(asc(skillRequests.createdAt));
}

export type ManagedUser = {
  id: string;
  email: string;
  accountStatus: string;
  roleNames: string[];
  createdAt: Date;
};

/** Every account, for the admin user table. */
export async function getManagedUsers(): Promise<ManagedUser[]> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      accountStatus: users.accountStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt));

  const roleRows = await db
    .select({ userId: userRoles.userId, name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id));

  return rows.map((row) => ({
    ...row,
    roleNames: roleRows.filter((role) => role.userId === row.id).map((role) => role.name),
  }));
}

/** Catalogue skills with how many candidates claim each one. */
export async function getSkillsWithUsage() {
  const catalogue = await db
    .select({ id: skills.id, name: skills.name, isActive: skills.isActive })
    .from(skills)
    .orderBy(asc(skills.name));

  const usage = await db
    .select({ skillId: candidateSkills.skillId, id: candidateSkills.id })
    .from(candidateSkills);

  return catalogue.map((skill) => ({
    ...skill,
    claimedBy: usage.filter((row) => row.skillId === skill.id).length,
  }));
}

/** Resolves a role id by name, used when granting or revoking a role. */
export async function findRoleIdByName(name: string): Promise<string | null> {
  const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, name)).limit(1);

  return role?.id ?? null;
}

/** Looks up a user by email for reviewer appointment. */
export async function findUserByEmail(email: string) {
  const [user] = await db
    .select({ id: users.id, email: users.email, accountStatus: users.accountStatus })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user ?? null;
}

/** Role names already held by a user. */
export async function getRoleNamesForUser(userId: string): Promise<string[]> {
  const rows = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  return rows.map((row) => row.name);
}

/** Owner user ids for a set of companies, used when approving. */
export async function getCompanyOwnerIds(companyIds: string[]): Promise<string[]> {
  if (companyIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({ ownerId: companies.createdById })
    .from(companies)
    .where(inArray(companies.id, companyIds));

  return rows.map((row) => row.ownerId);
}
