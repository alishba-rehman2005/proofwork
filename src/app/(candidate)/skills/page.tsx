import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ActivityGrid,
  Badge,
  ButtonLink,
  Card,
  CardDescription,
  CardTitle,
  QuoteBlock,
  StatCard,
} from "@/components/ui";
import {
  getActivityCalendar,
  getCandidateOverview,
  getNextAssessment,
  getPastAssessments,
} from "@/features/profiles/server/overview.queries";
import {
  AddSkillForm,
  SkillRequestForm,
  SkillTable,
} from "@/features/skills/components/skill-manager";
import {
  getAvailableSkills,
  getCandidateIdForUser,
  getCandidateSkills,
} from "@/features/skills/server/skills.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Skills",
};

export default async function SkillsPage() {
  const user = await requireRole([APP_ROLES.CANDIDATE]);

  const candidateId = await getCandidateIdForUser(user.id);

  if (!candidateId) {
    notFound();
  }

  const [rows, available, overview, calendar, past, next] = await Promise.all([
    getCandidateSkills(candidateId),
    getAvailableSkills(candidateId),
    getCandidateOverview(candidateId, user.id),
    getActivityCalendar(candidateId, 70),
    getPastAssessments(candidateId, 4),
    getNextAssessment(candidateId),
  ]);

  const activeDays = calendar.filter((day) => day.count > 0).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Skills &amp; assessments</h1>

          <p className="mt-1.5 text-muted">
            Manage your technical stack and the evaluations that verify it.
          </p>
        </div>

        <ButtonLink href="#add-skill">Claim a skill</ButtonLink>
      </header>

      <div className="stagger grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Verified skills"
          value={overview.verifiedSkills}
          tone="success"
          icon={<CheckIcon />}
          trend={
            overview.verifiedSkillsThisMonth > 0
              ? `+${overview.verifiedSkillsThisMonth} this month`
              : undefined
          }
          hint={`of ${rows.length} claimed`}
        >
          <div className="flex gap-1">
            {rows.slice(0, 12).map((row) => (
              <span
                key={row.id}
                title={`${row.skillName}: ${row.verificationStatus.toLowerCase()}`}
                className={`h-1.5 flex-1 rounded-sm ${
                  row.verificationStatus === "VERIFIED" ? "bg-success" : "bg-surface-muted"
                }`}
              />
            ))}
          </div>
        </StatCard>

        <StatCard
          label="Assessments open"
          value={overview.openAssessments}
          tone="accent"
          icon={<ClipboardIcon />}
          hint={
            overview.openAssessments > 0
              ? "Complete these to upgrade your profile."
              : "Nothing outstanding."
          }
        />

        <StatCard
          label="Verification activity"
          value={`${activeDays} active days`}
          tone="info"
          icon={<PulseIcon />}
        >
          <ActivityGrid days={calendar} />
        </StatCard>
      </div>

      {next && (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-accent/30 bg-accent-soft">
          <div>
            <p className="font-medium">{next.title}</p>

            <p className="mt-1 text-sm text-muted">
              Verifies {next.skillName}
              {next.estimatedDurationMinutes
                ? ` · about ${next.estimatedDurationMinutes} min`
                : ""}{" "}
              · due {formatDate(next.deadline)}
            </p>
          </div>

          <ButtonLink href={`/assessments/${next.assignmentId}`}>
            {next.status === "ASSIGNED" ? "Start challenge" : "Continue"}
          </ButtonLink>
        </Card>
      )}

      <Card className="space-y-4">
        <div>
          <CardTitle>Technical stack</CardTitle>

          <CardDescription>
            A skill stays unverified until a reviewer approves your assessment submission.
          </CardDescription>
        </div>

        <SkillTable rows={rows} />
      </Card>

      {past.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Past assessments</h2>

          <div className="grid gap-4 lg:grid-cols-2">
            {past.map((item) => (
              <Card key={item.submissionId} className="lift space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.assessmentTitle}</p>

                    <p className="mt-1 text-xs tracking-wider text-muted uppercase">
                      {item.skillName} · {formatDate(item.reviewedAt)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="tabular text-2xl font-semibold">
                      {item.totalScore}
                      <span className="text-base text-muted">/{item.maximumScore}</span>
                    </p>

                    <Badge tone={item.outcome === "APPROVED" ? "solid" : "danger"}>
                      {item.percentage}%
                    </Badge>
                  </div>
                </div>

                <QuoteBlock label="Reviewer feedback">{item.candidateFeedback}</QuoteBlock>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Card id="add-skill" className="space-y-4">
        <div>
          <CardTitle>Claim a skill</CardTitle>

          <CardDescription>
            Add it to your stack, then request verification to have it assessed.
          </CardDescription>
        </div>

        <AddSkillForm available={available} />
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Missing something?</CardTitle>

          <CardDescription>
            Suggest a skill for the catalogue and an admin will review it.
          </CardDescription>
        </div>

        <SkillRequestForm />
      </Card>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="7" y="4" width="10" height="4" rx="1" />
      <path d="M9 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12h4l2.5-6 4 12L16 12h5" />
    </svg>
  );
}
