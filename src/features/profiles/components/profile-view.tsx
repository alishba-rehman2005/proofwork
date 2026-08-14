import type { CandidateProfileWithRelations } from "../types";
import { formatDateRange, formatEnumLabel } from "../utils/format";

type ProfileViewProps = {
  profile: CandidateProfileWithRelations;
};

/**
 * Read-only rendering of a candidate profile.
 *
 * Shared by the owner's `/profile` page and the public `/candidates/[slug]`
 * page so both stay in step. Deliberately contains nothing private: the
 * account email and settings live on the owner page instead.
 */
export function ProfileView({ profile }: ProfileViewProps) {
  const links = [
    { label: "GitHub", url: profile.githubUrl },
    { label: "Portfolio", url: profile.portfolioUrl },
    { label: "Website", url: profile.websiteUrl },
    ...profile.socialLinks.map((link) => ({
      label: link.label || formatEnumLabel(link.platform),
      url: link.url,
    })),
  ].filter((link): link is { label: string; url: string } => Boolean(link.url));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5">
        {profile.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.profileImageUrl}
            alt={profile.fullName}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-surface-muted" />
        )}

        <div>
          <h1 className="text-3xl font-semibold">{profile.fullName}</h1>

          {profile.headline && <p className="mt-1 text-muted">{profile.headline}</p>}

          <p className="mt-2 text-sm text-muted">
            {[profile.city, profile.country].filter(Boolean).join(", ") || "Location not specified"}
            {profile.availability && ` · ${formatEnumLabel(profile.availability)}`}
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-xl font-semibold">About</h2>

        <p className="mt-3 whitespace-pre-wrap text-foreground">
          {profile.bio || "No bio added yet."}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Experience</h2>

        <div className="mt-4 space-y-4">
          {profile.experience.length === 0 ? (
            <p className="text-muted">No experience added.</p>
          ) : (
            profile.experience.map((item) => (
              <article key={item.id} className="rounded-xl border border-line p-4">
                <h3 className="font-medium">{item.jobTitle}</h3>

                <p className="text-foreground">
                  {[item.company, item.location].filter(Boolean).join(" — ")}
                </p>

                <p className="mt-1 text-sm text-muted">
                  {formatDateRange(item.startDate, item.endDate, item.currentlyWorking)}
                </p>

                {item.description && (
                  <p className="mt-2 whitespace-pre-wrap text-foreground">{item.description}</p>
                )}
              </article>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Education</h2>

        <div className="mt-4 space-y-4">
          {profile.education.length === 0 ? (
            <p className="text-muted">No education added.</p>
          ) : (
            profile.education.map((item) => (
              <article key={item.id} className="rounded-xl border border-line p-4">
                <h3 className="font-medium">{item.institution}</h3>

                <p className="text-foreground">
                  {[item.degree, item.fieldOfStudy].filter(Boolean).join(" — ")}
                </p>

                <p className="mt-1 text-sm text-muted">
                  {formatDateRange(item.startDate, item.endDate, item.currentlyStudying)}
                </p>

                {item.description && (
                  <p className="mt-2 whitespace-pre-wrap text-foreground">{item.description}</p>
                )}
              </article>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Links</h2>

        <div className="mt-4 space-y-2">
          {links.length === 0 ? (
            <p className="text-muted">No links added.</p>
          ) : (
            links.map((link) => (
              <a
                key={`${link.label}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="block text-primary underline"
              >
                {link.label}
              </a>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Skills</h2>

        <p className="mt-3 text-muted">Skill verification arrives in a later phase.</p>
      </section>
    </div>
  );
}
