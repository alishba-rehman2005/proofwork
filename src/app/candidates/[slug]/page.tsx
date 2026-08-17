import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { ProfileView } from "@/features/profiles/components/profile-view";
import { getCandidateProfileBySlug } from "@/features/profiles/server/profile.queries";
import { getProjectsForCandidate } from "@/features/projects/projects";
import { getCandidateSkills } from "@/features/skills/server/skills.queries";
import { ANONYMOUS_VIEWER, canViewProfile } from "@/features/profiles/utils/visibility";

type PublicProfilePageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Resolves the profile and the viewer, returning null when the viewer is not
 * allowed to see it.
 *
 * A hidden profile is reported as "not found" rather than "forbidden" so the
 * page does not confirm that a given slug exists.
 */
async function loadVisibleProfile(slug: string) {
  const profile = await getCandidateProfileBySlug(slug);

  if (!profile) {
    return null;
  }

  const session = await auth();

  const viewer = session?.user
    ? { userId: session.user.id, roles: session.user.roles }
    : ANONYMOUS_VIEWER;

  return canViewProfile(profile, viewer) ? profile : null;
}

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await loadVisibleProfile(slug);

  if (!profile) {
    return { title: "Profile not found" };
  }

  return {
    title: profile.fullName,
    description: profile.headline ?? `${profile.fullName} on ProofWork.`,
    // Hidden profiles never reach here, but public ones should still not be
    // indexed until the platform is ready for it.
    robots: { index: profile.profileVisibility === "PUBLIC", follow: false },
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { slug } = await params;
  const profile = await loadVisibleProfile(slug);

  if (!profile) {
    notFound();
  }

  const [skills, projects] = await Promise.all([
    getCandidateSkills(profile.id),
    getProjectsForCandidate(profile.id),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <ProfileView
        profile={profile}
        // Only proven work is shown publicly; skills still in flight are the
        // candidate's own business until a reviewer has approved them.
        skills={skills.filter((skill) => skill.verificationStatus === "VERIFIED")}
        projects={projects}
      />
    </main>
  );
}
