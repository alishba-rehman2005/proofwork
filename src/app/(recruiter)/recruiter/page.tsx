import type { Metadata } from "next";

import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  CardTitle,
  EmptyState,
  PageHeader,
  Stat,
  controlClassName,
} from "@/components/ui";
import { searchCandidates } from "@/features/recruiter/search";
import { getSkillCatalogue } from "@/features/skills/server/skills.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Find candidates",
};

type SearchParams = Promise<{
  skillId?: string;
  minScore?: string;
  location?: string;
  availability?: string;
  experienceLevel?: string;
  includeUnverified?: string;
}>;

export default async function RecruiterPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole([APP_ROLES.RECRUITER, APP_ROLES.ADMIN]);

  const params = await searchParams;

  const filters = {
    skillId: params.skillId || undefined,
    minScore: params.minScore ? Number(params.minScore) : undefined,
    location: params.location || undefined,
    availability: params.availability || undefined,
    experienceLevel: params.experienceLevel || undefined,
    verifiedOnly: params.includeUnverified !== "on",
  };

  const [results, catalogue] = await Promise.all([searchCandidates(filters), getSkillCatalogue()]);

  const totalVerified = results.reduce((sum, row) => sum + row.verifiedSkills.length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Find candidates"
        description="Search people whose skills have been proven through a reviewed practical assessment."
      />

      <dl className="stagger grid gap-4 sm:grid-cols-3">
        <Stat label="Candidates found" value={results.length} />
        <Stat label="Verified skills matched" value={totalVerified} />
        <Stat
          label="Top score"
          value={results.length > 0 ? `${Math.round(results[0].topScore)}%` : "—"}
        />
      </dl>

      <Card className="space-y-4">
        <CardTitle>Filters</CardTitle>

        <form method="get" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="skillId" className="text-sm font-medium">
              Skill
            </label>

            <select
              id="skillId"
              name="skillId"
              defaultValue={params.skillId ?? ""}
              className={`${controlClassName} mt-2`}
            >
              <option value="">Any skill</option>

              {catalogue.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="experienceLevel" className="text-sm font-medium">
              Experience level
            </label>

            <select
              id="experienceLevel"
              name="experienceLevel"
              defaultValue={params.experienceLevel ?? ""}
              className={`${controlClassName} mt-2`}
            >
              <option value="">Any level</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>

          <div>
            <label htmlFor="availability" className="text-sm font-medium">
              Availability
            </label>

            <select
              id="availability"
              name="availability"
              defaultValue={params.availability ?? ""}
              className={`${controlClassName} mt-2`}
            >
              <option value="">Any availability</option>
              <option value="AVAILABLE">Available</option>
              <option value="OPEN_TO_OPPORTUNITIES">Open to opportunities</option>
              <option value="NOT_AVAILABLE">Not available</option>
            </select>
          </div>

          <div>
            <label htmlFor="minScore" className="text-sm font-medium">
              Minimum score
            </label>

            <input
              id="minScore"
              name="minScore"
              type="number"
              min={0}
              max={100}
              defaultValue={params.minScore ?? ""}
              placeholder="70"
              className={`${controlClassName} mt-2`}
            />
          </div>

          <div>
            <label htmlFor="location" className="text-sm font-medium">
              Location
            </label>

            <input
              id="location"
              name="location"
              defaultValue={params.location ?? ""}
              placeholder="Lahore"
              className={`${controlClassName} mt-2`}
            />
          </div>

          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="includeUnverified"
                defaultChecked={params.includeUnverified === "on"}
                className="h-4 w-4 rounded border-line accent-current"
              />
              Include unverified
            </label>
          </div>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Search
            </button>

            <ButtonLink href="/recruiter" variant="secondary">
              Reset
            </ButtonLink>
          </div>
        </form>
      </Card>

      {results.length === 0 ? (
        <EmptyState
          title="No candidates match"
          description="Try widening the filters, or include unverified skills to see people still working towards verification."
        />
      ) : (
        <ul className="space-y-3">
          {results.map((candidate) => (
            <li key={candidate.candidateId}>
              <Card className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 gap-4">
                  <Avatar src={candidate.profileImageUrl} name={candidate.fullName} size={48} />

                  <div className="min-w-0">
                    <p className="font-medium">{candidate.fullName}</p>

                    {candidate.headline && (
                      <p className="text-sm text-muted">{candidate.headline}</p>
                    )}

                    <p className="mt-1 text-sm text-muted">
                      {[candidate.city, candidate.country].filter(Boolean).join(", ") ||
                        "Location not specified"}
                      {candidate.availability &&
                        ` · ${candidate.availability.replaceAll("_", " ").toLowerCase()}`}
                    </p>

                    {candidate.verifiedSkills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {candidate.verifiedSkills.slice(0, 8).map((skill) => (
                          <Badge key={skill.name} tone="solid">
                            <span aria-hidden="true">✓</span>
                            {skill.name}
                            {skill.score !== null && ` ${Math.round(skill.score)}%`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <ButtonLink href={`/candidates/${candidate.slug}`} variant="secondary" size="sm">
                  View profile
                </ButtonLink>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
