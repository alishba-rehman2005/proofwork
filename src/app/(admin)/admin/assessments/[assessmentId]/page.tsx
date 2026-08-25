import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status/status-badge";
import {
  Alert,
  Badge,
  Breadcrumb,
  Card,
  CardDescription,
  CardTitle,
  PageHeader,
  Stat,
} from "@/components/ui";
import {
  DeleteCriterionButton,
  DeleteResourceButton,
  PublishControls,
  ResourceForm,
  RubricCriterionForm,
} from "@/features/assessments/components/assessment-forms";
import { getAssessmentDetail } from "@/features/assessments/server/assessment.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Edit assessment",
};

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  await requireRole([APP_ROLES.ADMIN, APP_ROLES.REVIEWER]);

  const detail = await getAssessmentDetail(assessmentId);

  if (!detail) {
    notFound();
  }

  const { assessment, criteria, resources, skills } = detail;
  const totalWeight = criteria.reduce((sum, item) => sum + Number(item.weight), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Admin", href: "/admin" },
              { label: "Assessments", href: "/admin/assessments" },
              { label: assessment.title },
            ]}
          />
        }
        title={assessment.title}
        description={assessment.description}
        actions={<StatusBadge kind="assessment" status={assessment.status} />}
      />

      <dl className="grid gap-4 sm:grid-cols-4">
        <Stat label="Maximum" value={assessment.maximumScore} />
        <Stat label="Pass mark" value={assessment.passingScore} />
        <Stat label="Attempts" value={assessment.maxAttempts} />
        <Stat label="Criteria" value={criteria.length} />
      </dl>

      <Card className="space-y-3">
        <CardTitle>Verifies</CardTitle>

        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill.id} tone="outline">
              {skill.name}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Rubric</CardTitle>

          <CardDescription>
            Reviewers score each criterion. Weights are normalised, so they need not total 100 —
            currently {totalWeight}%.
          </CardDescription>
        </div>

        {criteria.length === 0 ? (
          <Alert tone="warning">
            This assessment cannot be published until it has at least one criterion. Without a
            rubric a reviewer would have nothing to score against.
          </Alert>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {criteria.map((criterion) => (
              <li
                key={criterion.id}
                className="flex flex-wrap items-start justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{criterion.name}</p>

                  {criterion.description && (
                    <p className="mt-1 text-sm text-muted">{criterion.description}</p>
                  )}

                  <p className="tabular mt-1 text-xs text-muted">
                    {Number(criterion.maximumPoints)} pts · weight {Number(criterion.weight)}%
                  </p>
                </div>

                <DeleteCriterionButton criterionId={criterion.id} assessmentId={assessment.id} />
              </li>
            ))}
          </ul>
        )}

        <RubricCriterionForm assessmentId={assessment.id} />
      </Card>

      <Card className="space-y-4">
        <CardTitle>Resources</CardTitle>

        {resources.length > 0 && (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {resources.map((resource) => (
              <li key={resource.id} className="flex items-center justify-between gap-3 p-4">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="-mx-1.5 inline-flex min-h-11 items-center rounded-md px-1.5 text-sm underline"
                >
                  {resource.title}
                </a>

                <DeleteResourceButton resourceId={resource.id} assessmentId={assessment.id} />
              </li>
            ))}
          </ul>
        )}

        <ResourceForm assessmentId={assessment.id} />
      </Card>

      <Card className="space-y-4">
        <CardTitle>Publishing</CardTitle>

        <PublishControls assessmentId={assessment.id} status={assessment.status} />
      </Card>
    </div>
  );
}
