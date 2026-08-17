import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  candidateProfiles,
  projects,
  teamContributions,
  teamMembers,
  teams,
  users,
} from "@/db/schema";

/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

export const createTeamSchema = z.object({
  projectId: z.uuid("Choose a project."),
  name: z
    .string()
    .trim()
    .min(2, "Team name must be at least 2 characters.")
    .max(120, "Team name must not exceed 120 characters."),
});

export const inviteMemberSchema = z.object({
  teamId: z.uuid(),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  projectRole: z
    .string()
    .trim()
    .min(2, "Describe their role on the project.")
    .max(80, "Role must not exceed 80 characters."),
});

export const contributionSchema = z.object({
  teamMemberId: z.uuid(),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(150, "Title must not exceed 150 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Describe what you actually did in at least 20 characters.")
    .max(2000),
  evidenceUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.url({ protocol: /^https?$/ }).safeParse(value).success,
      "Enter a valid http(s) URL.",
    )
    .transform((value) => (value === "" ? null : value)),
});

/*
|--------------------------------------------------------------------------
| QUERIES
|--------------------------------------------------------------------------
*/

export type TeamContribution = {
  id: string;
  title: string;
  description: string;
  evidenceUrl: string | null;
  verificationStatus: string;
};

export type TeamMemberRow = {
  memberId: string;
  userId: string;
  email: string;
  fullName: string | null;
  projectRole: string;
  status: string;
  joinedAt: Date | null;
  isMe: boolean;
  contributions: TeamContribution[];
};

export type TeamRow = {
  teamId: string;
  name: string;
  projectId: string;
  projectTitle: string;
  createdById: string;
  isOwner: boolean;
  members: TeamMemberRow[];
};

/**
 * Teams the user owns or belongs to.
 *
 * A team is attached to a project, so this is the shared view both the project
 * owner and each collaborator work from.
 */
export async function getTeamsForUser(userId: string): Promise<TeamRow[]> {
  const membership = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));

  const owned = await db
    .select({ teamId: teams.id })
    .from(teams)
    .where(eq(teams.createdById, userId));

  const teamIds = [...new Set([...membership, ...owned].map((row) => row.teamId))];

  if (teamIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      teamId: teams.id,
      name: teams.name,
      projectId: teams.projectId,
      projectTitle: projects.title,
      createdById: teams.createdById,
    })
    .from(teams)
    .innerJoin(projects, eq(teams.projectId, projects.id))
    .where(inArray(teams.id, teamIds))
    .orderBy(asc(teams.createdAt));

  const memberRows = await db
    .select({
      memberId: teamMembers.id,
      teamId: teamMembers.teamId,
      userId: teamMembers.userId,
      email: users.email,
      fullName: candidateProfiles.fullName,
      projectRole: teamMembers.projectRole,
      status: teamMembers.status,
      joinedAt: teamMembers.joinedAt,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .leftJoin(candidateProfiles, eq(candidateProfiles.userId, users.id))
    .where(inArray(teamMembers.teamId, teamIds))
    .orderBy(asc(teamMembers.createdAt));

  const contributionRows =
    memberRows.length > 0
      ? await db
          .select()
          .from(teamContributions)
          .where(
            inArray(
              teamContributions.teamMemberId,
              memberRows.map((row) => row.memberId),
            ),
          )
          .orderBy(asc(teamContributions.createdAt))
      : [];

  return rows.map((team) => ({
    ...team,
    isOwner: team.createdById === userId,
    members: memberRows
      .filter((member) => member.teamId === team.teamId)
      .map((member) => ({
        memberId: member.memberId,
        userId: member.userId,
        email: member.email,
        fullName: member.fullName,
        projectRole: member.projectRole,
        status: member.status,
        joinedAt: member.joinedAt,
        isMe: member.userId === userId,
        contributions: contributionRows
          .filter((contribution) => contribution.teamMemberId === member.memberId)
          .map((contribution) => ({
            id: contribution.id,
            title: contribution.title,
            description: contribution.description,
            evidenceUrl: contribution.evidenceUrl,
            verificationStatus: contribution.verificationStatus,
          })),
      })),
  }));
}

/** Candidate projects that do not yet have a team. */
export async function getProjectsWithoutTeam(candidateId: string) {
  const owned = await db
    .select({ id: projects.id, title: projects.title })
    .from(projects)
    .where(eq(projects.candidateId, candidateId))
    .orderBy(asc(projects.title));

  if (owned.length === 0) {
    return [];
  }

  const existing = await db
    .select({ projectId: teams.projectId })
    .from(teams)
    .where(
      inArray(
        teams.projectId,
        owned.map((row) => row.id),
      ),
    );

  const taken = new Set(existing.map((row) => row.projectId));

  return owned.filter((project) => !taken.has(project.id));
}

/** A team membership scoped to the user it belongs to. */
export async function getOwnedMembership(memberId: string, userId: string) {
  const [row] = await db
    .select({
      id: teamMembers.id,
      teamId: teamMembers.teamId,
      status: teamMembers.status,
    })
    .from(teamMembers)
    .where(and(eq(teamMembers.id, memberId), eq(teamMembers.userId, userId)))
    .limit(1);

  return row ?? null;
}

/** Contributions awaiting verification, for the reviewer queue. */
export async function getContributionsAwaitingVerification() {
  return db
    .select({
      id: teamContributions.id,
      title: teamContributions.title,
      description: teamContributions.description,
      evidenceUrl: teamContributions.evidenceUrl,
      memberEmail: users.email,
      memberName: candidateProfiles.fullName,
      projectRole: teamMembers.projectRole,
      teamName: teams.name,
      projectTitle: projects.title,
    })
    .from(teamContributions)
    .innerJoin(teamMembers, eq(teamContributions.teamMemberId, teamMembers.id))
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .leftJoin(candidateProfiles, eq(candidateProfiles.userId, users.id))
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .innerJoin(projects, eq(teams.projectId, projects.id))
    .where(eq(teamContributions.verificationStatus, "UNDER_REVIEW"))
    .orderBy(asc(teamContributions.createdAt));
}
