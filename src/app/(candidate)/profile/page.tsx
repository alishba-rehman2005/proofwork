import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Avatar, ButtonLink, Card, CardTitle, ProgressBar, StatCard } from "@/components/ui";
import { ProfileView } from "@/features/profiles/components/profile-view";
import { PublicProfileLink } from "@/features/profiles/components/public-profile-link";
import { getCandidateOverview } from "@/features/profiles/server/overview.queries";
import { getCandidateProfileByUserId } from "@/features/profiles/server/profile.queries";
import { calculateProfileCompleteness } from "@/features/profiles/utils/profile-completeness";
import { formatEnumLabel } from "@/features/profiles/utils/format";
import { describeVisibility } from "@/features/profiles/utils/visibility";
import { getProjectsForCandidate } from "@/features/projects/projects";
import { getCandidateSkills } from "@/features/skills/server/skills.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "My profile",
};

export default async function ProfilePage() {
  const user = await requireRole([APP_ROLES.CANDIDATE]);

  const profile = await getCandidateProfileByUserId(user.id);

  if (!profile) {
    notFound();
  }

  const [skills, projects, overview] = await Promise.all([
    getCandidateSkills(profile.id),
    getProjectsForCandidate(profile.id),
    getCandidateOverview(profile.id, user.id),
  ]);

  const completeness = calculateProfileCompleteness(profile);
  const verifiedProjects = projects.filter(
    (project) => project.verificationStatus === "VERIFIED",
  ).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Identity header, mirroring what a recruiter sees on the public page. */}
      <Card className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-5">
            <Avatar src={profile.profileImageUrl} name={profile.fullName} size={72} />

            <div className="min-w-0">
              <h1 className="text-2xl font-semibold sm:text-3xl">{profile.fullName}</h1>

              {profile.headline && <p className="mt-1 text-muted">{profile.headline}</p>}

              <p className="mt-1.5 text-sm text-muted">
                {[profile.city, profile.country].filter(Boolean).join(", ") ||
                  "Location not specified"}
                {profile.availability && ` · ${formatEnumLabel(profile.availability)}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-line px-4 py-2.5 text-center">
              <p className="text-xs tracking-wider text-muted uppercase">Trust score</p>

              <p className="tabular text-xl font-semibold">
                {overview.trustScore === null ? "—" : `${overview.trustScore}%`}
              </p>
            </div>

            <ButtonLink href="/profile/edit" variant="secondary">
              Edit profile
            </ButtonLink>
          </div>
        </div>

        {completeness < 100 && (
          <div className="space-y-2 border-t border-line pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Profile completeness</span>
              <span className="tabular">{completeness}%</span>
            </div>

            <ProgressBar value={completeness} label="Profile completeness" />
          </div>
        )}
      </Card>

      <dl className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Verified skills" value={overview.verifiedSkills} />
        <StatCard label="Assessments passed" value={overview.completedAssessments} />
        <StatCard label="Verified projects" value={verifiedProjects} />
        <StatCard label="Team contributions" value={overview.verifiedContributions} />
      </dl>

      <PublicProfileLink
        path={`/candidates/${profile.slug}`}
        description={describeVisibility(profile.profileVisibility)}
        isShareable={profile.profileVisibility === "PUBLIC"}
      />

      <Card className="space-y-6">
        <CardTitle>How recruiters see you</CardTitle>

        <ProfileView profile={profile} skills={skills} projects={projects} />
      </Card>
    </div>
  );
}
