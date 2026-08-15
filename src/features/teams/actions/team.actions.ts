"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import {
  candidateProfiles,
  projects,
  teamContributions,
  teamMembers,
  teams,
  users,
} from "@/db/schema";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole, requireUser } from "@/lib/auth/session";
import { notify, recordActivity } from "@/lib/notifications";

import { getCandidateIdForUser } from "@/features/skills/server/skills.queries";

import {
  contributionSchema,
  createTeamSchema,
  getOwnedMembership,
  inviteMemberSchema,
} from "../teams";

export type TeamActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const MAX_MEMBERS = 12;

function revalidateTeams() {
  revalidatePath("/teams");
  revalidatePath("/projects");
  revalidatePath("/reviewer");
}

function failure(error: z.ZodError, message: string): TeamActionState {
  return {
    success: false,
    message,
    errors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  };
}

/**
 * Creates a team against a project the candidate owns.
 *
 * The owner is added as a member immediately so their own contributions live
 * alongside everyone else's rather than being a special case.
 */
export async function createTeamAction(
  _previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const user = await requireRole([APP_ROLES.CANDIDATE]);
  const candidateId = await getCandidateIdForUser(user.id);

  if (!candidateId) {
    return { success: false, message: "We could not find your candidate profile." };
  }

  const parsed = createTeamSchema.safeParse({
    projectId: String(formData.get("projectId") ?? ""),
    name: String(formData.get("name") ?? ""),
  });

  if (!parsed.success) {
    return failure(parsed.error, "Please correct the team details.");
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, parsed.data.projectId), eq(projects.candidateId, candidateId)))
    .limit(1);

  if (!project) {
    return { success: false, message: "Project not found." };
  }

  try {
    await db.transaction(async (tx) => {
      const [team] = await tx
        .insert(teams)
        .values({ projectId: project.id, name: parsed.data.name, createdById: user.id })
        .returning({ id: teams.id });

      if (!team) {
        throw new Error("Failed to create team.");
      }

      await tx.insert(teamMembers).values({
        teamId: team.id,
        userId: user.id,
        projectRole: "Project owner",
        status: "ACTIVE",
        joinedAt: new Date(),
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false, message: "That project already has a team." };
    }

    throw error;
  }

  revalidateTeams();

  return { success: true, message: "Team created." };
}

/** Invites an existing account onto a team. */
export async function inviteMemberAction(
  _previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const user = await requireUser();

  const parsed = inviteMemberSchema.safeParse({
    teamId: String(formData.get("teamId") ?? ""),
    email: String(formData.get("email") ?? ""),
    projectRole: String(formData.get("projectRole") ?? ""),
  });

  if (!parsed.success) {
    return failure(parsed.error, "Please correct the invitation.");
  }

  const [team] = await db
    .select({ id: teams.id, name: teams.name, createdById: teams.createdById })
    .from(teams)
    .where(eq(teams.id, parsed.data.teamId))
    .limit(1);

  // Only the team owner can invite: otherwise any member could add people to
  // a project they do not own.
  if (!team || team.createdById !== user.id) {
    return { success: false, message: "Only the team owner can invite members." };
  }

  const existingMembers = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, team.id));

  if (existingMembers.length >= MAX_MEMBERS) {
    return { success: false, message: `A team can have at most ${MAX_MEMBERS} members.` };
  }

  const [invitee] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (!invitee) {
    return { success: false, message: "No account found with that email address." };
  }

  try {
    await db.insert(teamMembers).values({
      teamId: team.id,
      userId: invitee.id,
      projectRole: parsed.data.projectRole,
      status: "INVITED",
    });
  } catch (error) {
    if (isUniqueViolation(error, "team_members_team_user_unique")) {
      return { success: false, message: "That person is already on the team." };
    }

    throw error;
  }

  await notify({
    userId: invitee.id,
    type: "TEAM_INVITATION",
    title: "Team invitation",
    message: `You have been invited to join ${team.name} as ${parsed.data.projectRole}.`,
    entityType: "team",
    entityId: team.id,
  });

  revalidateTeams();

  return { success: true, message: `Invitation sent to ${parsed.data.email}.` };
}

/** Accepts or declines an invitation addressed to the signed-in user. */
export async function respondToInvitationAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const memberId = String(formData.get("memberId") ?? "");
  const accept = String(formData.get("response") ?? "") === "accept";

  if (!z.uuid().safeParse(memberId).success) {
    return;
  }

  const membership = await getOwnedMembership(memberId, user.id);

  if (!membership || membership.status !== "INVITED") {
    return;
  }

  await db
    .update(teamMembers)
    .set({
      status: accept ? "ACTIVE" : "DECLINED",
      joinedAt: accept ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(teamMembers.id, memberId));

  if (accept) {
    const candidateId = await getCandidateIdForUser(user.id);

    if (candidateId) {
      await recordActivity({
        candidateId,
        type: "TEAM_JOINED",
        entityType: "team",
        entityId: membership.teamId,
      });
    }
  }

  revalidateTeams();
}

/** Removes a member. Owners can remove anyone; members can remove themselves. */
export async function removeMemberAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const memberId = String(formData.get("memberId") ?? "");

  if (!z.uuid().safeParse(memberId).success) {
    return;
  }

  const [member] = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      teamId: teamMembers.teamId,
      ownerId: teams.createdById,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.id, memberId))
    .limit(1);

  if (!member) {
    return;
  }

  const isOwner = member.ownerId === user.id;
  const isSelf = member.userId === user.id;

  // The owner cannot remove themselves: the team would be left unmanaged.
  if ((!isOwner && !isSelf) || (isSelf && isOwner)) {
    return;
  }

  await db
    .update(teamMembers)
    .set({ status: "REMOVED", updatedAt: new Date() })
    .where(eq(teamMembers.id, memberId));

  revalidateTeams();
}

/** Records what a member actually did, and submits it for verification. */
export async function addContributionAction(
  _previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const user = await requireUser();

  const parsed = contributionSchema.safeParse({
    teamMemberId: String(formData.get("teamMemberId") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    evidenceUrl: String(formData.get("evidenceUrl") ?? ""),
  });

  if (!parsed.success) {
    return failure(parsed.error, "Please correct the contribution.");
  }

  const membership = await getOwnedMembership(parsed.data.teamMemberId, user.id);

  if (!membership || membership.status !== "ACTIVE") {
    return { success: false, message: "You can only log contributions for your own membership." };
  }

  await db.insert(teamContributions).values({
    teamMemberId: parsed.data.teamMemberId,
    title: parsed.data.title,
    description: parsed.data.description,
    evidenceUrl: parsed.data.evidenceUrl,
    verificationStatus: parsed.data.evidenceUrl ? "UNDER_REVIEW" : "UNVERIFIED",
  });

  const candidateId = await getCandidateIdForUser(user.id);

  if (candidateId) {
    await recordActivity({
      candidateId,
      type: "TEAM_CONTRIBUTION_ADDED",
      entityType: "team",
      entityId: membership.teamId,
      metadata: { title: parsed.data.title },
    });
  }

  revalidateTeams();

  return {
    success: true,
    message: parsed.data.evidenceUrl
      ? "Contribution logged and sent for verification."
      : "Contribution logged. Add an evidence link to have it verified.",
  };
}

export async function deleteContributionAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const id = String(formData.get("contributionId") ?? "");

  if (!z.uuid().safeParse(id).success) {
    return;
  }

  const [row] = await db
    .select({ id: teamContributions.id, memberUserId: teamMembers.userId })
    .from(teamContributions)
    .innerJoin(teamMembers, eq(teamContributions.teamMemberId, teamMembers.id))
    .where(eq(teamContributions.id, id))
    .limit(1);

  if (!row || row.memberUserId !== user.id) {
    return;
  }

  await db.delete(teamContributions).where(eq(teamContributions.id, id));

  revalidateTeams();
}

/** Reviewer decision on a claimed contribution. */
export async function decideContributionAction(formData: FormData): Promise<void> {
  await requireRole([APP_ROLES.REVIEWER, APP_ROLES.ADMIN]);

  const id = String(formData.get("contributionId") ?? "");
  const approve = String(formData.get("decision") ?? "") === "approve";

  if (!z.uuid().safeParse(id).success) {
    return;
  }

  const [row] = await db
    .select({ id: teamContributions.id, memberUserId: teamMembers.userId })
    .from(teamContributions)
    .innerJoin(teamMembers, eq(teamContributions.teamMemberId, teamMembers.id))
    .where(
      and(eq(teamContributions.id, id), eq(teamContributions.verificationStatus, "UNDER_REVIEW")),
    )
    .limit(1);

  if (!row) {
    return;
  }

  await db
    .update(teamContributions)
    .set({
      verificationStatus: approve ? "VERIFIED" : "REJECTED",
      updatedAt: new Date(),
    })
    .where(eq(teamContributions.id, id));

  await notify({
    userId: row.memberUserId,
    type: approve ? "ASSESSMENT_APPROVED" : "CHANGES_REQUESTED",
    title: approve ? "Contribution verified" : "Contribution not verified",
    message: approve
      ? "A reviewer confirmed your team contribution."
      : "A reviewer could not verify your team contribution.",
    entityType: "contribution",
    entityId: id,
  });

  revalidateTeams();
}

/** Used by the teams page to resolve the viewer's candidate profile. */
export async function resolveCandidateProfileId(userId: string) {
  return getCandidateIdForUser(userId);
}

/** Resolves a candidate display name, used in team listings. */
export async function getDisplayName(userId: string) {
  const [row] = await db
    .select({ fullName: candidateProfiles.fullName })
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, userId))
    .limit(1);

  return row?.fullName ?? null;
}
