import type { Metadata } from "next";

import { ButtonLink, Card, CardTitle, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { getCandidateProfileByUserId } from "@/features/profiles/server/profile.queries";
import { calculateProfileCompleteness } from "@/features/profiles/utils/profile-completeness";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireRole([
    APP_ROLES.CANDIDATE,
    APP_ROLES.REVIEWER,
    APP_ROLES.RECRUITER,
    APP_ROLES.ADMIN,
  ]);

  const profile = user.roles.includes(APP_ROLES.CANDIDATE)
    ? await getCandidateProfileByUserId(user.id)
    : null;

  const completeness = profile ? calculateProfileCompleteness(profile) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={profile ? `Welcome back, ${profile.fullName}` : "Welcome back"}
        description={`Signed in as ${user.email} · ${user.primaryRole ?? "No primary role"}`}
      />

      {profile && completeness !== null && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Your profile</CardTitle>

            <span className="text-sm text-muted">{completeness}% complete</span>
          </div>

          <p className="text-muted">
            {completeness === 100
              ? "Your profile is complete."
              : "Adding more detail helps recruiters find you."}
          </p>

          <ProgressBar value={completeness} label="Profile completeness" />

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/profile">View profile</ButtonLink>

            <ButtonLink href="/profile/edit" variant="secondary">
              Edit profile
            </ButtonLink>
          </div>
        </Card>
      )}

      <Card className="space-y-4">
        <CardTitle>Skills &amp; assessments</CardTitle>

        <EmptyState
          title="No skills added yet"
          description="Skill management, assessments and verification arrive in the next phase."
        />
      </Card>
    </div>
  );
}
