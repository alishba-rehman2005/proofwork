import type { Metadata } from "next";

import { StatusBadge } from "@/components/status/status-badge";
import {
  Badge,
  ButtonLink,
  Card,
  CardDescription,
  CardTitle,
  EmptyState,
  PageHeader,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from "@/components/ui";
import { CreateAssessmentForm } from "@/features/assessments/components/assessment-forms";
import { getAssessments } from "@/features/assessments/server/assessment.queries";
import { getSkillCatalogue } from "@/features/skills/server/skills.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Assessment library",
};

export default async function AssessmentLibraryPage() {
  await requireRole([APP_ROLES.ADMIN, APP_ROLES.REVIEWER]);

  const [assessments, catalogue] = await Promise.all([getAssessments(), getSkillCatalogue()]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Assessment library"
        description="Practical challenges used to verify skills. A draft must have a rubric before it can be published."
      />

      <Card className="space-y-4">
        <CardTitle>Library</CardTitle>

        {assessments.length === 0 ? (
          <EmptyState
            title="No assessments yet"
            description="Create the first one below, add its rubric, then publish it."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Title</TH>
                <TH>Skills</TH>
                <TH>Difficulty</TH>
                <TH>Status</TH>
                <TH className="text-right">Pass mark</TH>
                <TH className="text-right">Action</TH>
              </TR>
            </THead>

            <TBody>
              {assessments.map((row) => (
                <TR key={row.id}>
                  <TD className="font-medium">{row.title}</TD>

                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {row.skillNames.map((name) => (
                        <Badge key={name} tone="outline">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </TD>

                  <TD className="text-sm text-muted">{row.difficulty.toLowerCase()}</TD>

                  <TD>
                    <StatusBadge kind="assessment" status={row.status} />
                  </TD>

                  <TD className="tabular text-right">
                    {row.passingScore}/{row.maximumScore}
                  </TD>

                  <TD>
                    <div className="flex justify-end">
                      <ButtonLink
                        href={`/admin/assessments/${row.id}`}
                        variant="secondary"
                        size="sm"
                      >
                        Edit
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
          <CardTitle>Create an assessment</CardTitle>

          <CardDescription>
            It starts as a draft. Add rubric criteria on the next screen, then publish.
          </CardDescription>
        </div>

        <CreateAssessmentForm
          skillOptions={catalogue
            .filter((skill) => skill.isActive)
            .map((skill) => ({
              id: skill.id,
              name: skill.name,
            }))}
        />
      </Card>
    </div>
  );
}
