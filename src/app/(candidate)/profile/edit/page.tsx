import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AvatarUpload } from "@/features/profiles/components/avatar-upload";
import { EducationForm } from "@/features/profiles/components/education-form";
import { ExperienceForm } from "@/features/profiles/components/experience-form";
import { ProfileForm } from "@/features/profiles/components/profile-form";
import { PublicProfileLink } from "@/features/profiles/components/public-profile-link";
import { SocialLinkForm } from "@/features/profiles/components/social-link-form";
import { getCandidateProfileByUserId } from "@/features/profiles/server/profile.queries";
import { describeVisibility } from "@/features/profiles/utils/visibility";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Edit profile",
};

export default async function EditProfilePage() {
  const user = await requireRole([APP_ROLES.CANDIDATE]);

  const profile = await getCandidateProfileByUserId(user.id);

  if (!profile) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl space-y-12 p-6">
      <header>
        <h1 className="text-3xl font-semibold">Edit profile</h1>

        <p className="mt-2 text-muted">
          Manage the professional information recruiters and reviewers can see.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Public link</h2>

        <PublicProfileLink
          path={`/candidates/${profile.slug}`}
          description={describeVisibility(profile.profileVisibility)}
          isShareable={profile.profileVisibility === "PUBLIC"}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Profile photo</h2>

        <AvatarUpload currentImageUrl={profile.profileImageUrl} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Basic information</h2>

        <ProfileForm profile={profile} />
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-semibold">Education</h2>

        {profile.education.map((item) => (
          <EducationForm key={item.id} item={item} />
        ))}

        <h3 className="pt-2 font-medium text-foreground">Add education</h3>

        <EducationForm />
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-semibold">Experience</h2>

        {profile.experience.map((item) => (
          <ExperienceForm key={item.id} item={item} />
        ))}

        <h3 className="pt-2 font-medium text-foreground">Add experience</h3>

        <ExperienceForm />
      </section>

      <section className="space-y-5">
        <h2 className="text-xl font-semibold">Social links</h2>

        {profile.socialLinks.map((item) => (
          <SocialLinkForm key={item.id} item={item} />
        ))}

        <h3 className="pt-2 font-medium text-foreground">Add social link</h3>

        <SocialLinkForm />
      </section>
    </main>
  );
}
