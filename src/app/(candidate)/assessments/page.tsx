import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status/status-badge";
import {
  Badge,
  ButtonLink,
  Card,
  CardDescription,
  CardTitle,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { getCandidateAssignments } from "@/features/assessments/server/assessment.queries";
import { getCandidateIdForUser } from "@/features/skills/server/skills.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Assessments",
};

const OPEN_STATUSES = ["ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED", "SUBMITTED", "UNDER_REVIEW"];

export default async function AssessmentsPage() {
  const user = await requireRole([APP_ROLES.CANDIDATE]);

  const candidateId = await getCandidateIdForUser(user.id);

  if (!candidateId) {
    notFound();
  }

  const assignments = await getCandidateAssignments(candidateId);

  const open = assignments.filter((row) => OPEN_STATUSES.includes(row.status));
  const closed = assignments.filter((row) => !OPEN_STATUSES.includes(row.status));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Assessments"
        description="Practical work assigned to verify the skills you asked to prove."
      />

      <Card className="space-y-4">
        <div>
          <CardTitle>Open</CardTitle>

          <CardDescription>Assessments still needing your attention.</CardDescription>
        </div>

        {open.length === 0 ? (
          <EmptyState
            title="Nothing assigned right now"
            description="Request verification on a skill and an assessment will be assigned to you."
            action={<ButtonLink href="/skills">Go to skills</ButtonLink>}
          />
        ) : (
          <ul className="space-y-3">
            {open.map((row) => (
              <li key={row.assignmentId}>
                <AssignmentCard row={row} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {closed.length > 0 && (
        <Card className="space-y-4">
          <CardTitle>Completed</CardTitle>

          <ul className="space-y-3">
            {closed.map((row) => (
              <li key={row.assignmentId}>
                <AssignmentCard row={row} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function AssignmentCard({
  row,
}: {
  row: Awaited<ReturnType<typeof getCandidateAssignments>>[number];
}) {
  const overdue = row.isOverdue && OPEN_STATUSES.includes(row.status);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-line p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{row.title}</p>

          <StatusBadge kind="assignment" status={row.status} />

          {overdue && <Badge tone="danger">Overdue</Badge>}
        </div>

        <p className="mt-1 text-sm text-muted">
          Verifies <span className="text-foreground">{row.skillName}</span> ·{" "}
          {row.difficulty.toLowerCase()} · attempt {row.attemptsUsed}/{row.maxAttempts}
        </p>

        <p className="mt-1 text-sm text-muted">Deadline {formatDate(row.deadline)}</p>
      </div>

      <ButtonLink href={`/assessments/${row.assignmentId}`} variant="secondary" size="sm">
        Open
      </ButtonLink>
    </div>
  );
}
