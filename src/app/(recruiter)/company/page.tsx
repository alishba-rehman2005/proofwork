import type { Metadata } from "next";

import { StatusBadge } from "@/components/status/status-badge";
import { Alert, Avatar, Card, CardDescription, CardTitle, PageHeader } from "@/components/ui";
import { getCompanyForUser } from "@/features/companies/company";
import { CompanyDetailsForm, CompanyTeam } from "@/features/companies/components/company-forms";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Company",
};

export default async function CompanyPage() {
  const user = await requireRole([APP_ROLES.RECRUITER, APP_ROLES.ADMIN]);

  const company = await getCompanyForUser(user.id);

  if (!company) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Company" description="Your organisation on ProofWork." />

        <Alert tone="info" title="No company linked">
          This account is not a member of a company. Register as a company to create one, or ask an
          existing owner to add you.
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Company"
        description="How your organisation appears to candidates and reviewers."
      />

      <Card className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={company.logoUrl} name={company.name} size={56} />

            <div>
              <h2 className="text-xl font-semibold">{company.name}</h2>

              <p className="mt-1 text-sm text-muted">
                {[company.industry, company.location].filter(Boolean).join(" · ") ||
                  "No industry or location set"}
              </p>
            </div>
          </div>

          <StatusBadge kind="company" status={company.status} />
        </div>

        {company.status === "PENDING" && (
          <Alert tone="warning" title="Awaiting approval">
            An administrator is reviewing this company. Candidate search stays unavailable until it
            is approved.
          </Alert>
        )}
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Details</CardTitle>

          <CardDescription>Shown to candidates when you contact them.</CardDescription>
        </div>

        <CompanyDetailsForm company={company} />
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Team</CardTitle>

          <CardDescription>Everyone here can search candidates under this company.</CardDescription>
        </div>

        <CompanyTeam company={company} />
      </Card>
    </div>
  );
}
