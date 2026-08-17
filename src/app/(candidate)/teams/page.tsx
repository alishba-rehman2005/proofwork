import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, CardDescription, CardTitle, PageHeader, Stat } from "@/components/ui";
import { CreateTeamForm, TeamList } from "@/features/teams/components/team-manager";
import { getProjectsWithoutTeam, getTeamsForUser } from "@/features/teams/teams";
import { getCandidateIdForUser } from "@/features/skills/server/skills.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Teams",
};

export default async function TeamsPage() {
  const user = await requireRole([APP_ROLES.CANDIDATE]);

  const candidateId = await getCandidateIdForUser(user.id);

  if (!candidateId) {
    notFound();
  }

  const [teams, availableProjects] = await Promise.all([
    getTeamsForUser(user.id),
    getProjectsWithoutTeam(candidateId),
  ]);

  const invitations = teams.flatMap((team) =>
    team.members.filter((member) => member.isMe && member.status === "INVITED"),
  );

  const myContributions = teams.flatMap((team) =>
    team.members.filter((member) => member.isMe).flatMap((member) => member.contributions),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Teams"
        description="Collaborate on a project and record what each person actually built, so credit is attributable."
      />

      <dl className="stagger grid gap-4 sm:grid-cols-3">
        <Stat label="Teams" value={teams.length} />
        <Stat label="Pending invitations" value={invitations.length} />
        <Stat
          label="Verified contributions"
          value={myContributions.filter((c) => c.verificationStatus === "VERIFIED").length}
        />
      </dl>

      <TeamList teams={teams} />

      <Card className="space-y-4">
        <div>
          <CardTitle>Start a team</CardTitle>

          <CardDescription>
            Teams attach to a project you own. Invite collaborators by the email they signed up
            with.
          </CardDescription>
        </div>

        <CreateTeamForm projects={availableProjects} />
      </Card>
    </div>
  );
}
