import type { Metadata } from "next";

import {
  Badge,
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
import {
  getAuditActions,
  getAuditTrail,
  getPlatformStats,
} from "@/features/admin/server/admin.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Reports",
};

/** Actions that change who can do what, or what counts as proven. */
const SENSITIVE = new Set([
  "REVIEWER_SKILL_GRANTED",
  "REVIEWER_SKILL_REVOKED",
  "ROLE_GRANTED",
  "ROLE_REVOKED",
  "ACCOUNT_STATUS_CHANGED",
  "COMPANY_APPROVED",
  "COMPANY_REJECTED",
]);

function toneFor(action: string) {
  if (action.startsWith("REVIEW_APPROVED") || action.endsWith("_APPROVED")) return "success";
  if (action.endsWith("_REJECTED") || action.endsWith("_REVOKED")) return "danger";
  if (SENSITIVE.has(action)) return "warning";

  return "accent";
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  await requireRole([APP_ROLES.ADMIN]);

  const { action } = await searchParams;

  const [entries, actions, stats] = await Promise.all([
    getAuditTrail(60, action),
    getAuditActions(),
    getPlatformStats(),
  ]);

  const sensitiveCount = entries.filter((entry) => SENSITIVE.has(entry.action)).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Reports"
        description="Platform totals and the audit trail behind every privileged action."
        actions={
          <ButtonLink href="/admin" variant="secondary">
            Back to admin
          </ButtonLink>
        }
      />

      <dl className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={stats.totalUsers} />
        <Stat label="Skills verified" value={stats.skillsVerified} />
        <Stat label="Assessments completed" value={stats.assessmentsCompleted} />
        <Stat label="Projects submitted" value={stats.projectsSubmitted} />
        <Stat label="Active candidates" value={stats.activeCandidates} />
        <Stat label="Companies registered" value={stats.companiesRegistered} />
        <Stat label="Reviewers" value={stats.reviewers} />
        <Stat label="Permission changes shown" value={sensitiveCount} />
      </dl>

      <Card className="space-y-4">
        <div>
          <CardTitle>Audit trail</CardTitle>

          <CardDescription>
            Written automatically whenever someone approves, verifies, or changes access. Entries
            cannot be edited from the interface.
          </CardDescription>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Filter by action">
          <ButtonLink href="/admin/reports" size="sm" variant={action ? "secondary" : "primary"}>
            All
          </ButtonLink>

          {actions.map((item) => (
            <ButtonLink
              key={item}
              href={`/admin/reports?action=${encodeURIComponent(item)}`}
              size="sm"
              variant={action === item ? "primary" : "secondary"}
            >
              {item.replaceAll("_", " ").toLowerCase()}
            </ButtonLink>
          ))}
        </nav>

        {entries.length === 0 ? (
          <EmptyState
            title="Nothing recorded yet"
            description="Approvals, verifications and permission changes will appear here."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>When</TH>
                <TH>Action</TH>
                <TH>Entity</TH>
                <TH>Actor</TH>
                <TH>Detail</TH>
              </TR>
            </THead>

            <TBody>
              {entries.map((entry) => (
                <TR key={entry.id}>
                  <TD className="text-xs whitespace-nowrap text-muted">
                    {formatDateTime(entry.createdAt)}
                  </TD>

                  <TD>
                    <Badge tone={toneFor(entry.action)}>
                      {entry.action.replaceAll("_", " ").toLowerCase()}
                    </Badge>
                  </TD>

                  <TD className="text-sm text-muted">{entry.entityType}</TD>

                  <TD className="text-sm">{entry.actorName ?? entry.actorEmail ?? "System"}</TD>

                  <TD className="max-w-xs truncate text-xs text-muted">
                    {entry.newValues ? JSON.stringify(entry.newValues) : "—"}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
