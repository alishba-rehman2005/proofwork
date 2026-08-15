import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status/status-badge";
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  CardTitle,
  EmptyState,
  PageHeader,
  Stat,
} from "@/components/ui";
import {
  getAssessmentDetail,
  getAssignmentForCandidate,
  getSubmissionsForAssignment,
} from "@/features/assessments/server/assessment.queries";
import {
  StartAssessmentButton,
  SubmissionForm,
  WithdrawSubmissionButton,
} from "@/features/submissions/components/submission-form";
import { getCandidateIdForUser } from "@/features/skills/server/skills.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Assessment",
};

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const user = await requireRole([APP_ROLES.CANDIDATE]);

  const candidateId = await getCandidateIdForUser(user.id);

  if (!candidateId) {
    notFound();
  }

  const assignment = await getAssignmentForCandidate(assignmentId, candidateId);

  if (!assignment) {
    notFound();
  }

  const [detail, submissionList] = await Promise.all([
    getAssessmentDetail(assignment.assessmentId),
    getSubmissionsForAssignment(assignment.assignmentId),
  ]);

  if (!detail) {
    notFound();
  }

  const { assessment, criteria, resources } = detail;
  const deadlinePassed = assignment.deadlinePassed;
  const canSubmit = ["ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED"].includes(assignment.status);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[{ label: "Assessments", href: "/assessments" }, { label: assessment.title }]}
          />
        }
        title={assessment.title}
        description={`Verifies ${assignment.skillName}`}
        actions={<StatusBadge kind="assignment" status={assignment.status} />}
      />

      <dl className="grid gap-4 sm:grid-cols-3">
        <Stat label="Maximum score" value={assessment.maximumScore} />
        <Stat label="Pass mark" value={assessment.passingScore} />
        <Stat
          label="Deadline"
          value={new Date(assignment.deadline).toLocaleDateString()}
          hint={deadlinePassed ? "Passed" : undefined}
        />
      </dl>

      {assignment.status === "CHANGES_REQUESTED" && (
        <Alert tone="warning" title="Changes requested">
          Your reviewer asked for changes. Read their feedback below and submit again.
        </Alert>
      )}

      <Card className="space-y-4">
        <CardTitle>Brief</CardTitle>

        <Section title="Description" body={assessment.description} />
        <Section title="Requirements" body={assessment.requirements} />
        <Section title="How to submit" body={assessment.submissionInstructions} />

        {assessment.estimatedDurationMinutes && (
          <p className="text-sm text-muted">
            Estimated effort: {assessment.estimatedDurationMinutes} minutes
          </p>
        )}
      </Card>

      <Card className="space-y-4">
        <CardTitle>Scoring rubric</CardTitle>

        {criteria.length === 0 ? (
          <p className="text-sm text-muted">No rubric published.</p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {criteria.map((criterion) => (
              <li key={criterion.id} className="flex flex-wrap justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{criterion.name}</p>

                  {criterion.description && (
                    <p className="mt-1 text-sm text-muted">{criterion.description}</p>
                  )}
                </div>

                <div className="tabular text-sm text-muted">
                  {Number(criterion.maximumPoints)} pts · weight {Number(criterion.weight)}%
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {resources.length > 0 && (
        <Card className="space-y-3">
          <CardTitle>Resources</CardTitle>

          <ul className="space-y-2">
            {resources.map((resource) => (
              <li key={resource.id}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm underline"
                >
                  {resource.title}
                </a>

                {resource.resourceType && (
                  <span className="ms-2 text-xs text-muted">{resource.resourceType}</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="space-y-4">
        <CardTitle>Your submission</CardTitle>

        {assignment.status === "ASSIGNED" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Start the assessment when you are ready to begin. Your reviewer will see the start
              time.
            </p>

            <StartAssessmentButton assignmentId={assignment.assignmentId} />
          </div>
        ) : canSubmit ? (
          <SubmissionForm
            assignmentId={assignment.assignmentId}
            attemptsUsed={submissionList.length}
            maxAttempts={assignment.maxAttempts}
            deadlinePassed={deadlinePassed}
          />
        ) : (
          <p className="text-sm text-muted">This assessment is no longer open for submissions.</p>
        )}
      </Card>

      <Card className="space-y-4">
        <CardTitle>History</CardTitle>

        {submissionList.length === 0 ? (
          <EmptyState title="No attempts yet" description="Your submissions will appear here." />
        ) : (
          <ul className="space-y-4">
            {submissionList.map((submission) => (
              <li key={submission.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="outline">Attempt {submission.attemptNumber}</Badge>

                    <StatusBadge kind="submission" status={submission.status} />

                    <span className="text-xs text-muted">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </span>
                  </div>

                  {submission.status === "SUBMITTED" && (
                    <WithdrawSubmissionButton submissionId={submission.id} />
                  )}
                </div>

                {submission.evidence.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-3">
                    {submission.evidence.map((item) => (
                      <li key={item.id}>
                        <a
                          href={item.url ?? "#"}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-sm underline"
                        >
                          {item.title ?? item.type}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {submission.notes && (
                  <p className="mt-3 text-sm whitespace-pre-wrap text-muted">{submission.notes}</p>
                )}

                {submission.review && (
                  <div className="mt-4 rounded-lg bg-surface-muted p-3">
                    <p className="text-sm font-medium">
                      Reviewer feedback · {Number(submission.review.totalScore)} /{" "}
                      {assessment.maximumScore}
                    </p>

                    <p className="mt-1 text-sm whitespace-pre-wrap text-muted">
                      {submission.review.candidateFeedback}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>

      <p className="mt-1 text-sm whitespace-pre-wrap text-muted">{body}</p>
    </div>
  );
}
