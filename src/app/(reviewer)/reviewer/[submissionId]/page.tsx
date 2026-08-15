import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status/status-badge";
import {
  Alert,
  Badge,
  Breadcrumb,
  ButtonLink,
  Card,
  CardTitle,
  PageHeader,
  Stat,
} from "@/components/ui";
import { ClaimReviewButton, ReviewForm } from "@/features/reviews/components/review-form";
import { getSubmissionForReview } from "@/features/reviews/server/review.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Review submission",
};

export default async function ReviewSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const user = await requireRole([APP_ROLES.REVIEWER, APP_ROLES.ADMIN]);

  const detail = await getSubmissionForReview(submissionId);

  if (!detail) {
    notFound();
  }

  const assignedElsewhere = Boolean(detail.reviewerId && detail.reviewerId !== user.id);
  const alreadyReviewed = Boolean(detail.review);
  const canScore =
    !alreadyReviewed && !assignedElsewhere && detail.submissionStatus === "UNDER_REVIEW";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Review queue", href: "/reviewer" },
              { label: detail.assessmentTitle },
            ]}
          />
        }
        title={detail.assessmentTitle}
        description={`${detail.candidateName} · verifying ${detail.skillName}`}
        actions={
          <>
            <StatusBadge kind="submission" status={detail.submissionStatus} />

            <ButtonLink href={`/candidates/${detail.candidateSlug}`} variant="secondary" size="sm">
              View profile
            </ButtonLink>
          </>
        }
      />

      <dl className="grid gap-4 sm:grid-cols-3">
        <Stat label="Attempt" value={detail.attemptNumber} />
        <Stat label="Maximum score" value={detail.maximumScore} />
        <Stat label="Pass mark" value={detail.passingScore} />
      </dl>

      {assignedElsewhere && (
        <Alert tone="warning">This submission is assigned to another reviewer.</Alert>
      )}

      <Card className="space-y-3">
        <CardTitle>Requirements</CardTitle>

        <p className="text-sm whitespace-pre-wrap text-muted">{detail.requirements}</p>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Submitted evidence</CardTitle>

        {detail.evidence.length === 0 ? (
          <p className="text-sm text-muted">No evidence attached.</p>
        ) : (
          <ul className="flex flex-wrap gap-3">
            {detail.evidence.map((item) => (
              <li key={item.id}>
                <a
                  href={item.url ?? "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm transition-colors hover:bg-surface-muted"
                >
                  {item.title ?? item.type}
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ul>
        )}

        {detail.notes && (
          <div className="rounded-lg bg-surface-muted p-3">
            <p className="text-sm font-medium">Candidate notes</p>

            <p className="mt-1 text-sm whitespace-pre-wrap text-muted">{detail.notes}</p>
          </div>
        )}

        <p className="text-xs text-muted">
          Submitted {new Date(detail.submittedAt).toLocaleString()}
        </p>
      </Card>

      {alreadyReviewed && detail.review ? (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Review complete</CardTitle>

            <Badge tone={detail.review.outcome === "APPROVED" ? "solid" : "danger"}>
              {detail.review.outcome.replaceAll("_", " ").toLowerCase()}
            </Badge>
          </div>

          <p className="tabular text-2xl font-semibold">
            {Number(detail.review.totalScore)} / {detail.maximumScore}
          </p>

          <div>
            <p className="text-sm font-medium">Feedback given</p>

            <p className="mt-1 text-sm whitespace-pre-wrap text-muted">
              {detail.review.candidateFeedback}
            </p>
          </div>

          {detail.review.internalNotes && (
            <div>
              <p className="text-sm font-medium">Internal notes</p>

              <p className="mt-1 text-sm whitespace-pre-wrap text-muted">
                {detail.review.internalNotes}
              </p>
            </div>
          )}
        </Card>
      ) : canScore ? (
        <Card className="space-y-4">
          <CardTitle>Score against the rubric</CardTitle>

          <ReviewForm
            submissionId={detail.submissionId}
            criteria={detail.criteria.map((criterion) => ({
              id: criterion.id,
              name: criterion.name,
              description: criterion.description,
              maximumPoints: criterion.maximumPoints,
              weight: criterion.weight,
            }))}
            maximumScore={detail.maximumScore}
            passingScore={detail.passingScore}
          />
        </Card>
      ) : (
        <Card className="space-y-3">
          <CardTitle>Start reviewing</CardTitle>

          <p className="text-sm text-muted">
            Claiming this submission marks it under review so another reviewer does not duplicate
            your work.
          </p>

          {!assignedElsewhere && <ClaimReviewButton submissionId={detail.submissionId} />}
        </Card>
      )}
    </div>
  );
}
