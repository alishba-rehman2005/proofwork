import type { Metadata } from "next";

import { StatusBadge } from "@/components/status/status-badge";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardDescription,
  CardTitle,
  EmptyState,
  PageHeader,
  Stat,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@/components/ui";
import { getReviewerExpertise } from "@/features/reviews/expertise";
import { getCompletedReviews, getReviewQueue } from "@/features/reviews/server/review.queries";
import { decideContributionAction } from "@/features/teams/actions/team.actions";
import { getContributionsAwaitingVerification } from "@/features/teams/teams";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Review queue",
};

export default async function ReviewerPage() {
  const user = await requireRole([APP_ROLES.REVIEWER, APP_ROLES.ADMIN]);

  const [queue, completed, contributions, expertise] = await Promise.all([
    getReviewQueue(user.id, { unrestricted: user.roles.includes(APP_ROLES.ADMIN) }),
    getCompletedReviews(user.id),
    getContributionsAwaitingVerification(),
    getReviewerExpertise(user.id),
  ]);

  const approved = completed.filter((row) => row.outcome === "APPROVED").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Review queue"
        description="Score submitted work against its rubric. Approving is what verifies a candidate's skill."
      />

      <dl className="stagger grid gap-4 sm:grid-cols-3">
        <Stat label="Awaiting review" value={queue.length} />
        <Stat label="Reviews completed" value={completed.length} />
        <Stat label="Skills verified by you" value={approved} />
      </dl>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Your verification authority</CardTitle>

            <CardDescription>You can only review submissions for these skills.</CardDescription>
          </div>
        </div>

        {expertise.filter((grant) => grant.canVerify).length === 0 ? (
          <Alert tone="warning" title="No skills granted yet">
            An administrator has not cleared you to verify any skill, so your queue stays empty.
          </Alert>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {expertise
              .filter((grant) => grant.canVerify)
              .map((grant) => (
                <li key={grant.id}>
                  <Badge tone="accent">{grant.skillName}</Badge>
                </li>
              ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Awaiting review</CardTitle>

          <CardDescription>
            Unassigned submissions are shown too, so nothing sits in limbo. Filtered to skills you
            are cleared to verify.
          </CardDescription>
        </div>

        {queue.length === 0 ? (
          <EmptyState
            title="Queue is clear"
            description="New submissions will appear here as candidates send work in."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Candidate</TH>
                <TH>Assessment</TH>
                <TH>Skill</TH>
                <TH>Status</TH>
                <TH>Deadline</TH>
                <TH className="text-right">Action</TH>
              </TR>
            </THead>

            <TBody>
              {queue.map((row) => (
                <TR key={row.submissionId}>
                  <TD>
                    <div className="font-medium">{row.candidateName}</div>

                    <div className="text-xs text-muted">Attempt {row.attemptNumber}</div>
                  </TD>

                  <TD>{row.assessmentTitle}</TD>

                  <TD>{row.skillName}</TD>

                  <TD>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge kind="submission" status={row.status} />

                      {!row.isMine && <Badge tone="outline">Unassigned</Badge>}
                    </div>
                  </TD>

                  <TD className="tabular text-sm text-muted">{formatDate(row.deadline)}</TD>

                  <TD>
                    <div className="flex justify-end">
                      <ButtonLink
                        href={`/reviewer/${row.submissionId}`}
                        size="sm"
                        variant="secondary"
                      >
                        Open
                      </ButtonLink>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Team contributions</CardTitle>

          <CardDescription>
            Members claim what they personally built. Confirm the evidence supports the claim.
          </CardDescription>
        </div>

        {contributions.length === 0 ? (
          <EmptyState
            title="No contributions awaiting verification"
            description="Claims with an evidence link will appear here."
          />
        ) : (
          <ul className="space-y-3">
            {contributions.map((contribution) => (
              <li
                key={contribution.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-line p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{contribution.title}</p>

                    <Badge tone="outline">{contribution.projectRole}</Badge>
                  </div>

                  <p className="mt-1 text-sm text-muted">{contribution.description}</p>

                  <p className="mt-1 text-xs text-faint">
                    {contribution.memberName ?? contribution.memberEmail} · {contribution.teamName}{" "}
                    · {contribution.projectTitle}
                  </p>

                  {contribution.evidenceUrl && (
                    <a
                      href={contribution.evidenceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1 inline-block text-sm underline"
                    >
                      Evidence
                    </a>
                  )}
                </div>

                <div className="flex gap-2">
                  <form action={decideContributionAction}>
                    <input type="hidden" name="contributionId" value={contribution.id} />
                    <input type="hidden" name="decision" value="approve" />

                    <Button type="submit" size="sm">
                      Verify
                    </Button>
                  </form>

                  <form action={decideContributionAction}>
                    <input type="hidden" name="contributionId" value={contribution.id} />
                    <input type="hidden" name="decision" value="reject" />

                    <Button type="submit" size="sm" variant="ghost">
                      Reject
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4">
        <CardTitle>Recently reviewed</CardTitle>

        {completed.length === 0 ? (
          <EmptyState title="No reviews yet" />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Candidate</TH>
                <TH>Skill</TH>
                <TH>Outcome</TH>
                <TH className="text-right">Score</TH>
                <TH>Reviewed</TH>
              </TR>
            </THead>

            <TBody>
              {completed.slice(0, 15).map((row) => (
                <TR key={row.id}>
                  <TD>{row.candidateName}</TD>
                  <TD>{row.skillName}</TD>

                  <TD>
                    <StatusBadge kind="submission" status={row.outcome} />
                  </TD>

                  <TD className="tabular text-right">{Number(row.totalScore)}</TD>

                  <TD className="text-sm text-muted">{formatDate(row.reviewedAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
