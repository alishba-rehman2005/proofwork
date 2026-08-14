import type { Metadata } from "next";

import { Card, CardTitle, PageHeader } from "@/components/ui";
import { PendingCompanies } from "@/features/admin/components/pending-companies";
import { ReviewerManagement } from "@/features/admin/components/reviewer-management";
import {
  getPendingCompanies,
  getPlatformStats,
  getReviewers,
} from "@/features/admin/server/admin.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  await requireRole([APP_ROLES.ADMIN]);

  const [stats, pendingCompanies, reviewers] = await Promise.all([
    getPlatformStats(),
    getPendingCompanies(),
    getReviewers(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Administration"
        description="Approve company accounts and appoint reviewers."
      />

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={stats.totalUsers} />
        <Stat label="Candidates" value={stats.activeCandidates} />
        <Stat label="Awaiting approval" value={stats.pendingCompanies} />
        <Stat label="Reviewers" value={stats.reviewers} />
      </dl>

      <Card className="space-y-4">
        <CardTitle>Company approvals</CardTitle>

        <p className="text-sm text-muted">
          Company accounts cannot sign in until approved, because a recruiter can read candidate
          data.
        </p>

        <PendingCompanies companies={pendingCompanies} />
      </Card>

      <Card className="space-y-4">
        <CardTitle>Reviewers</CardTitle>

        <ReviewerManagement reviewers={reviewers} />
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <dt className="text-sm text-muted">{label}</dt>

      <dd className="mt-1 text-2xl font-semibold">{value}</dd>
    </Card>
  );
}
