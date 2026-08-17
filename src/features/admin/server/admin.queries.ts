import { asc, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  assessmentAssignments,
  auditLogs,
  candidateSkills,
  companies,
  companyMembers,
  projects,
  roles,
  skillCategories,
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
 * One round trip using scalar subqueries. The previous version issued eight
 * parallel queries that each selected every row just to read `.length`, which
 * both scanned whole tables needlessly and held eight pooled connections at
 * once - enough to starve the pool when the page ran its other queries
 * alongside it.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*) FROM ${users})::int AS total_users,
      (SELECT count(DISTINCT ${userRoles.userId})
         FROM ${userRoles}
         JOIN ${roles} ON ${roles.id} = ${userRoles.roleId}
        WHERE ${roles.name} = 'CANDIDATE')::int AS active_candidates,
      (SELECT count(*) FROM ${companies} WHERE ${companies.status} = 'PENDING')::int
        AS pending_companies,
      (SELECT count(DISTINCT ${userRoles.userId})
         FROM ${userRoles}
         JOIN ${roles} ON ${roles.id} = ${userRoles.roleId}
        WHERE ${roles.name} = 'REVIEWER')::int AS reviewers,
      (SELECT count(*) FROM ${candidateSkills}
        WHERE ${candidateSkills.verificationStatus} = 'VERIFIED')::int AS skills_verified,
      (SELECT count(*) FROM ${assessmentAssignments}
        WHERE ${assessmentAssignments.status} = 'APPROVED')::int AS assessments_completed,
      (SELECT count(*) FROM ${projects})::int AS projects_submitted,
      (SELECT count(*) FROM ${companies})::int AS companies_registered
  `);

  const row = (result as unknown as Record<string, number>[])[0] ?? {};

  return {
    totalUsers: Number(row.total_users ?? 0),
    activeCandidates: Number(row.active_candidates ?? 0),
    pendingCompanies: Number(row.pending_companies ?? 0),
    reviewers: Number(row.reviewers ?? 0),
    skillsVerified: Number(row.skills_verified ?? 0),
    assessmentsCompleted: Number(row.assessments_completed ?? 0),
    projectsSubmitted: Number(row.projects_submitted ?? 0),
    companiesRegistered: Number(row.companies_registered ?? 0),
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

/** Active skill categories, for the create-skill form. */
export async function getSkillCategories() {
  return db
    .select({ id: skillCategories.id, name: skillCategories.name })
    .from(skillCategories)
    .where(eq(skillCategories.isActive, true))
    .orderBy(asc(skillCategories.name));
}

export type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  newValues: unknown;
  createdAt: Date;
};

/**
 * The platform audit trail.
 *
 * Every approval, verification and role change already writes here; this is
 * the read side that makes it reviewable rather than write-only.
 */
export async function getAuditTrail(limit = 60, action?: string): Promise<AuditEntry[]> {
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      actorEmail: users.email,
      actorName: users.name,
      newValues: auditLogs.newValues,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorUserId, users.id))
    .where(action ? eq(auditLogs.action, action) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

/** Distinct action names present in the log, for the filter control. */
export async function getAuditActions(): Promise<string[]> {
  const rows = await db.selectDistinct({ action: auditLogs.action }).from(auditLogs);

  return rows.map((row) => row.action).sort();
}
