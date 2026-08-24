import type { Metadata } from "next";

import { StatusBadge } from "@/components/status/status-badge";
import {
  Badge,
  ButtonLink,
  Card,
  CardTitle,
  EmptyState,
  ProgressBar,
  QuoteBlock,
  ScoreMeter,
  StatCard,
  TimelineList,
} from "@/components/ui";
import { getActivityFeed } from "@/features/activity/activity";
import { getCandidateProfileByUserId } from "@/features/profiles/server/profile.queries";
import {
  getCandidateOverview,
  getNextAssessment,
  getPastAssessments,
  getPortfolioHighlights,
  getSkillScores,
} from "@/features/profiles/server/overview.queries";
import { calculateProfileCompleteness } from "@/features/profiles/utils/profile-completeness";
import { getCandidateIdForUser } from "@/features/skills/server/skills.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { formatDate, formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard",
};

const ACTIVITY_LABELS: Record<string, string> = {
  SKILL_ADDED: "Skill added",
  SKILL_VERIFIED: "Skill verified",
  ASSESSMENT_STARTED: "Assessment started",
  ASSESSMENT_SUBMITTED: "Assessment submitted",
  ASSESSMENT_COMPLETED: "Assessment completed",
  REVIEW_RECEIVED: "Feedback received",
  PROJECT_CREATED: "Project added",
  PROJECT_VERIFIED: "Project verified",
  TEAM_JOINED: "Joined a team",
  TEAM_CONTRIBUTION_ADDED: "Contribution logged",
};

export default async function DashboardPage() {
  const user = await requireRole([
    APP_ROLES.CANDIDATE,
    APP_ROLES.REVIEWER,
    APP_ROLES.RECRUITER,
    APP_ROLES.ADMIN,
  ]);

  const isCandidate = user.roles.includes(APP_ROLES.CANDIDATE);
  const candidateId = isCandidate ? await getCandidateIdForUser(user.id) : null;

  if (!candidateId) {
    return <StaffDashboard email={user.email} roles={user.roles} />;
  }

  const [profile, overview, scores, activity, projects, past, next] = await Promise.all([
    getCandidateProfileByUserId(user.id),
    getCandidateOverview(candidateId, user.id),
    getSkillScores(candidateId, 5),
    getActivityFeed(candidateId, 5),
    getPortfolioHighlights(candidateId, 2),
    getPastAssessments(candidateId, 1),
    getNextAssessment(candidateId),
  ]);

  const completeness = profile ? calculateProfileCompleteness(profile) : 0;
  const firstName = profile?.fullName.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Welcome back, {firstName}.</h1>

          <p className="mt-1.5 text-muted">Your verification overview and recent activity.</p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-2.5 text-success">
          <ShieldIcon />

          <span className="text-sm font-medium">
            Overall trust score:{" "}
            <span className="tabular">
              {overview.trustScore === null ? "—" : `${overview.trustScore}%`}
            </span>
          </span>
        </div>
      </header>

      <dl className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Assessments"
          value={overview.totalAssessments}
          icon={<TaskIcon />}
          tone="info"
          trend={
            overview.assessmentsThisMonth > 0
              ? `+${overview.assessmentsThisMonth} completed this month`
              : undefined
          }
          hint={`${overview.openAssessments} open`}
        />

        <StatCard
          label="Verified skills"
          value={overview.verifiedSkills}
          icon={<BadgeIcon />}
          tone="success"
          trend={
            overview.verifiedSkillsThisMonth > 0
              ? `+${overview.verifiedSkillsThisMonth} this month`
              : undefined
          }
          hint={`${overview.pendingReview} pending review`}
        />

        <StatCard
          label="Team contributions"
          value={overview.teamContributions}
          icon={<TeamIcon />}
          tone="accent"
          hint={`${overview.verifiedContributions} verified`}
        />
      </dl>

      {next && (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-accent/30 bg-accent-soft">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
              <TaskIcon />
            </span>

            <div>
              <p className="font-medium">{next.title}</p>

              <p className="mt-1 text-sm text-muted">
                Verifies {next.skillName} · {next.difficulty.toLowerCase()}
                {next.estimatedDurationMinutes
                  ? ` · about ${next.estimatedDurationMinutes} min`
                  : ""}{" "}
                · due {formatDate(next.deadline)}
              </p>
            </div>
          </div>

          <ButtonLink href={`/assessments/${next.assignmentId}`}>
            {next.status === "ASSIGNED" ? "Start assessment" : "Continue"}
          </ButtonLink>
        </Card>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card className="space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Verification overview</CardTitle>

            <ButtonLink href="/skills" variant="ghost" size="sm">
              View all
            </ButtonLink>
          </div>

          {scores.length === 0 ? (
            <EmptyState
              title="No skills yet"
              description="Add a skill and request verification to start building a verified profile."
              action={<ButtonLink href="/skills">Add a skill</ButtonLink>}
            />
          ) : (
            <div className="space-y-5">
              {scores.map((skill) => (
                <ScoreMeter
                  key={skill.id}
                  label={skill.skillName}
                  score={skill.score}
                  tone={skill.status === "VERIFIED" ? "success" : "accent"}
                  badge={<StatusBadge kind="skill" status={skill.status} />}
                  caption={skill.categoryName ?? undefined}
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-5">
          <CardTitle>Recent activity</CardTitle>

          {activity.length === 0 ? (
            <p className="text-sm text-muted">Nothing recorded yet.</p>
          ) : (
            <TimelineList
              items={activity.map((event, index) => {
                const meta = event.metadata as Record<string, unknown> | null;
                const detail =
                  typeof meta?.skill === "string"
                    ? meta.skill
                    : typeof meta?.skillName === "string"
                      ? meta.skillName
                      : typeof meta?.title === "string"
                        ? meta.title
                        : undefined;

                return {
                  id: event.id,
                  title: ACTIVITY_LABELS[event.type] ?? event.type,
                  body: detail,
                  timestamp: formatDateTime(event.createdAt),
                  emphasis: index === 0,
                };
              })}
            />
          )}
        </Card>
      </div>

      {past.length > 0 && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Latest review</CardTitle>

            <span className="tabular text-2xl font-semibold">
              {past[0].totalScore}/{past[0].maximumScore}
            </span>
          </div>

          <p className="text-sm text-muted">
            {past[0].assessmentTitle} · {past[0].skillName} · {formatDate(past[0].reviewedAt)}
          </p>

          <QuoteBlock label="Reviewer feedback">{past[0].candidateFeedback}</QuoteBlock>
        </Card>
      )}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Project portfolio</CardTitle>

          <ButtonLink href="/projects" size="sm">
            Add project
          </ButtonLink>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Add the work you are proudest of and request verification."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.id}
                className="lift flex flex-col rounded-xl border border-line p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{project.title}</p>

                  <StatusBadge kind="project" status={project.verificationStatus} />
                </div>

                <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{project.description}</p>

                {project.skillNames.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {project.skillNames.map((name) => (
                      <li key={name}>
                        <Badge tone="outline">{name}</Badge>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                  <span>Updated {formatDate(project.updatedAt)}</span>

                  <ButtonLink href="/projects" variant="ghost" size="sm">
                    View details
                  </ButtonLink>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      {completeness < 100 && (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Complete your profile</CardTitle>

            <span className="tabular text-sm text-muted">{completeness}%</span>
          </div>

          <ProgressBar value={completeness} label="Profile completeness" />

          <p className="text-sm text-muted">
            A fuller profile gives recruiters more context around your verified work.
          </p>

          <ButtonLink href="/profile/edit" variant="secondary" size="sm">
            Edit profile
          </ButtonLink>
        </Card>
      )}
    </div>
  );
}

/** Reviewers, recruiters and admins have no candidate profile to summarise. */
function StaffDashboard({ email, roles }: { email?: string | null; roles: string[] }) {
  const destinations = [
    { role: APP_ROLES.REVIEWER, href: "/reviewer", label: "Review queue" },
    { role: APP_ROLES.RECRUITER, href: "/recruiter", label: "Find candidates" },
    { role: APP_ROLES.ADMIN, href: "/admin", label: "Administration" },
  ].filter((item) => roles.includes(item.role));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Welcome back</h1>

        <p className="mt-1.5 text-muted">Signed in as {email}</p>
      </header>

      <Card className="space-y-4">
        <CardTitle>Your workspace</CardTitle>

        <div className="flex flex-wrap gap-3">
          {destinations.map((item) => (
            <ButtonLink key={item.href} href={item.href}>
              {item.label}
            </ButtonLink>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 3 5 5.5v5c0 4.2 2.9 7.3 7 9 4.1-1.7 7-4.8 7-9v-5L12 3Z" />
      <path d="m9 11.5 2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TaskIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="9" r="5" />
      <path d="m8.5 13.5-1 7 4.5-2.5 4.5 2.5-1-7" strokeLinejoin="round" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M3 20v-1.2A5.2 5.2 0 0 1 8.2 13.6h1.6A5.2 5.2 0 0 1 15 18.8V20M15.5 13.4a4.6 4.6 0 0 1 5.5 4.5V19" />
    </svg>
  );
}
