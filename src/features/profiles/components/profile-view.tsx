import { StatusBadge } from "@/components/status/status-badge";
import { Badge } from "@/components/ui";

import type { CandidateProfileWithRelations } from "../types";
import { formatDateRange, formatEnumLabel } from "../utils/format";

export type ProfileSkill = {
  id: string;
  skillName: string;
  experienceLevel: string;
  verificationStatus: string;
  currentScore: string | null;
  projectsCompleted?: number;
  reviewerFeedback?: string | null;
};

export type ProfileProject = {
  id: string;
  title: string;
  description: string;
  githubUrl: string | null;
  liveUrl: string | null;
  verificationStatus: string;
  skillNames: string[];
};

type ProfileViewProps = {
  profile: CandidateProfileWithRelations;
  skills?: ProfileSkill[];
  projects?: ProfileProject[];
};

/**
 * Read-only rendering of a candidate profile.
 *
 * Shared by the owner's `/profile` page and the public `/candidates/[slug]`
 * page so both stay in step. Deliberately contains nothing private: the
 * account email and settings live on the owner page instead.
 */
export function ProfileView({ profile, skills = [], projects = [] }: ProfileViewProps) {
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

        {skills.length === 0 ? (
          <p className="mt-3 text-muted">No skills added yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {skills.map((skill) => (
              <li
                key={skill.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{skill.skillName}</span>

                  <Badge tone="outline">{skill.experienceLevel.toLowerCase()}</Badge>

                  <StatusBadge kind="skill" status={skill.verificationStatus} />
                </div>

                <div className="tabular text-sm text-muted">
                  {skill.currentScore
                    ? `Score ${Math.round(Number(skill.currentScore))}/100`
                    : "Not scored"}
                  {typeof skill.projectsCompleted === "number" &&
                    ` · ${skill.projectsCompleted} assessment(s) passed`}
                </div>

                {skill.reviewerFeedback && (
                  <p className="mt-2 w-full border-t border-line pt-2 text-sm text-muted">
                    <span className="font-medium text-foreground">Reviewer:</span>{" "}
                    {skill.reviewerFeedback}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold">Projects</h2>

        {projects.length === 0 ? (
          <p className="mt-3 text-muted">No projects added yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {projects.map((project) => (
              <li key={project.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{project.title}</p>

                  <StatusBadge kind="project" status={project.verificationStatus} />
                </div>

                <p className="mt-1 text-sm whitespace-pre-wrap text-muted">{project.description}</p>

                {project.skillNames.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {project.skillNames.map((name) => (
                      <Badge key={name} tone="outline">
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline"
                    >
                      Repository
                    </a>
                  )}

                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline"
                    >
                      Live demo
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
