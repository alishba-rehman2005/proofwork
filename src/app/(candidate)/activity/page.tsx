import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Badge,
  Card,
  CardDescription,
  CardTitle,
  EmptyState,
  PageHeader,
  Stat,
} from "@/components/ui";
import { getActivityFeed } from "@/features/activity/activity";
import { getProjectsForCandidate } from "@/features/projects/projects";
import { getCandidateIdForUser, getCandidateSkills } from "@/features/skills/server/skills.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Activity",
};

const LABELS: Record<string, string> = {
  SKILL_ADDED: "Added a skill",
  SKILL_VERIFIED: "Skill verified",
  ASSESSMENT_STARTED: "Started an assessment",
  ASSESSMENT_SUBMITTED: "Submitted an assessment",
  ASSESSMENT_COMPLETED: "Completed an assessment",
  REVIEW_RECEIVED: "Received a review",
  PROJECT_CREATED: "Added a project",
  PROJECT_VERIFIED: "Project verified",
  TEAM_JOINED: "Joined a team",
  TEAM_CONTRIBUTION_ADDED: "Logged a team contribution",
};

export default async function ActivityPage() {
  const user = await requireRole([APP_ROLES.CANDIDATE]);

  const candidateId = await getCandidateIdForUser(user.id);

  if (!candidateId) {
    notFound();
  }

  const [events, skills, projects] = await Promise.all([
    getActivityFeed(candidateId, 50),
    getCandidateSkills(candidateId),
    getProjectsForCandidate(candidateId),
  ]);

  const verifiedSkills = skills.filter((skill) => skill.verificationStatus === "VERIFIED").length;
  const submitted = events.filter((event) => event.type === "ASSESSMENT_SUBMITTED").length;
  const reviews = events.filter((event) =>
    ["REVIEW_RECEIVED", "SKILL_VERIFIED"].includes(event.type),
  ).length;
  const contributions = events.filter((event) => event.type === "TEAM_CONTRIBUTION_ADDED").length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Activity"
        description="Everything you have done on the platform, and what it adds up to."
      />

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Skills verified" value={verifiedSkills} />
        <Stat label="Assessments submitted" value={submitted} />
        <Stat label="Reviews received" value={reviews} />
        <Stat label="Projects" value={projects.length} />
        <Stat label="Team contributions" value={contributions} />
      </dl>

      <Card className="space-y-4">
        <div>
          <CardTitle>Timeline</CardTitle>

          <CardDescription>Newest first.</CardDescription>
        </div>

        {events.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            description="Add a skill or a project and your activity will show up here."
          />
        ) : (
          <ol className="relative space-y-4 border-s border-line ps-6">
            {events.map((event) => {
              const meta = event.metadata as Record<string, unknown> | null;

              return (
                <li key={event.id} className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -start-[1.6rem] top-1.5 h-2 w-2 rounded-full bg-primary"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{LABELS[event.type] ?? event.type}</p>

                    {typeof meta?.skill === "string" && <Badge tone="outline">{meta.skill}</Badge>}

                    {typeof meta?.skillName === "string" && (
                      <Badge tone="outline">{meta.skillName}</Badge>
                    )}

                    {typeof meta?.title === "string" && <Badge tone="outline">{meta.title}</Badge>}

                    {typeof meta?.score === "number" && <Badge tone="solid">{meta.score}%</Badge>}
                  </div>

                  <p className="mt-1 text-xs text-muted">{formatDateTime(event.createdAt)}</p>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}
