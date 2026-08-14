import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileView } from "@/features/profiles/components/profile-view";
import { PublicProfileLink } from "@/features/profiles/components/public-profile-link";
import { getCandidateProfileByUserId } from "@/features/profiles/server/profile.queries";
import { calculateProfileCompleteness } from "@/features/profiles/utils/profile-completeness";
import { describeVisibility } from "@/features/profiles/utils/visibility";
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

  const completeness = calculateProfileCompleteness(profile);

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">Profile completeness: {completeness}%</p>

        <Link
          href="/profile/edit"
          className="rounded-lg border border-line px-4 py-2 transition-colors hover:bg-surface-muted"
        >
          Edit profile
        </Link>
      </div>

      <PublicProfileLink
        path={`/candidates/${profile.slug}`}
        description={describeVisibility(profile.profileVisibility)}
        isShareable={profile.profileVisibility === "PUBLIC"}
      />

      <ProfileView profile={profile} />
    </main>
  );
}
