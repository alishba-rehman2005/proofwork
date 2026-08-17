import type { Metadata } from "next";

import { Badge, Card, CardTitle, EmptyState, PageHeader, Stat } from "@/components/ui";
import {
  ProjectVerificationQueue,
  SkillCatalogue,
  SkillRequests,
  UserTable,
} from "@/features/admin/components/catalogue-manager";
import { PendingCompanies } from "@/features/admin/components/pending-companies";
import { ReviewerManagement } from "@/features/admin/components/reviewer-management";
import { ExpertiseManager } from "@/features/reviews/components/expertise-manager";
import { getReviewersWithExpertise } from "@/features/reviews/expertise";
import {
  getManagedUsers,
  getPendingCompanies,
  getPendingSkillRequests,
  getPlatformStats,
  getReviewers,
  getSkillCategories,
  getSkillsWithUsage,
} from "@/features/admin/server/admin.queries";
import { AssignAssessmentForm } from "@/features/assessments/components/assessment-forms";
import {
  getAssessmentsForSkill,
  getPendingVerificationRequests,
  getReviewerOptions,
} from "@/features/assessments/server/assessment.queries";
import { decideProjectVerificationAction } from "@/features/projects/actions/project.actions";
import { getProjectsAwaitingVerification } from "@/features/projects/projects";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const admin = await requireRole([APP_ROLES.ADMIN]);

  const [
    stats,
    pendingCompanies,
    reviewers,
    pendingRequests,
    reviewerOptions,
    skillRequests,
    managedUsers,
    catalogue,
    categories,
    pendingProjects,
    reviewerExpertise,
  ] = await Promise.all([
    getPlatformStats(),
    getPendingCompanies(),
    getReviewers(),
    getPendingVerificationRequests(),
    getReviewerOptions(),
    getPendingSkillRequests(),
    getManagedUsers(),
    getSkillsWithUsage(),
    getSkillCategories(),
    getProjectsAwaitingVerification(),
    getReviewersWithExpertise(),
  ]);

  // Each request can only be satisfied by an assessment covering its skill, so
  // the options are resolved per distinct skill rather than once globally.
  const distinctSkillIds = [...new Set(pendingRequests.map((request) => request.skillId))];

  const assessmentsBySkill = Object.fromEntries(
    await Promise.all(
      distinctSkillIds.map(
        async (skillId) => [skillId, await getAssessmentsForSkill(skillId)] as const,
      ),
    ),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Administration"
        description="Approvals, the skill catalogue, reviewers and platform analytics."
      />

      <dl className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={stats.totalUsers} />
        <Stat label="Active candidates" value={stats.activeCandidates} />
        <Stat label="Skills verified" value={stats.skillsVerified} />
        <Stat label="Assessments completed" value={stats.assessmentsCompleted} />
        <Stat label="Projects submitted" value={stats.projectsSubmitted} />
        <Stat label="Companies registered" value={stats.companiesRegistered} />
        <Stat label="Awaiting approval" value={stats.pendingCompanies} />
        <Stat label="Reviewers" value={stats.reviewers} />
      </dl>

      <Card className="space-y-4">
        <div>
          <CardTitle>Verification requests</CardTitle>

          <p className="text-sm text-muted">
            Assign a published assessment to move a skill out of unverified.
          </p>
        </div>

        {pendingRequests.length === 0 ? (
          <EmptyState
            title="No pending requests"
            description="Candidates requesting skill verification will appear here."
          />
        ) : (
          <ul className="space-y-4">
            {pendingRequests.map((request) => (
              <li key={request.requestId} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{request.candidateName}</p>

                  <Badge tone="outline">{request.skillName}</Badge>

                  <span className="text-xs text-muted">
                    {request.experienceLevel.toLowerCase()} · requested{" "}
                    {formatDate(request.requestedAt)}
                  </span>
                </div>

                <div className="mt-3">
                  <AssignAssessmentForm
                    requestId={request.requestId}
                    assessments={assessmentsBySkill[request.skillId] ?? []}
                    reviewers={reviewerOptions}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Company approvals</CardTitle>

          <p className="text-sm text-muted">
            Company accounts cannot sign in until approved, because a recruiter can read candidate
            data.
          </p>
        </div>

        <PendingCompanies companies={pendingCompanies} />
      </Card>

      <Card className="space-y-4">
        <CardTitle>Project verification</CardTitle>

        <ProjectVerificationQueue
          projects={pendingProjects}
          onDecide={decideProjectVerificationAction}
        />
      </Card>

      <Card className="space-y-4">
        <CardTitle>Reviewers</CardTitle>

        <ReviewerManagement reviewers={reviewers} />
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Verification authority</CardTitle>

          <p className="text-sm text-muted">
            A reviewer only sees submissions for skills granted here. Without a grant their queue is
            empty, so a Verified badge always means someone cleared for that skill approved it.
          </p>
        </div>

        <ExpertiseManager
          reviewers={reviewerExpertise}
          skills={catalogue.filter((skill) => skill.isActive)}
        />
      </Card>

      <Card className="space-y-4">
        <CardTitle>Skill suggestions</CardTitle>

        <SkillRequests requests={skillRequests} />
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Skill catalogue</CardTitle>

          <p className="text-sm text-muted">
            Retiring a skill hides it from new profiles without removing anyone&apos;s verified
            work.
          </p>
        </div>

        <SkillCatalogue skills={catalogue} categories={categories} />
      </Card>

      <Card className="space-y-4">
        <CardTitle>Users</CardTitle>

        <UserTable users={managedUsers} currentUserId={admin.id} />
      </Card>
    </div>
  );
}
