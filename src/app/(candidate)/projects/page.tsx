import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, CardDescription, CardTitle, PageHeader, Stat } from "@/components/ui";
import { ProjectForm, ProjectList } from "@/features/projects/components/project-manager";
import { getProjectsForCandidate } from "@/features/projects/projects";
import { getCandidateIdForUser, getSkillCatalogue } from "@/features/skills/server/skills.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  const user = await requireRole([APP_ROLES.CANDIDATE]);

  const candidateId = await getCandidateIdForUser(user.id);

  if (!candidateId) {
    notFound();
  }

  const [projects, catalogue] = await Promise.all([
    getProjectsForCandidate(candidateId),
    getSkillCatalogue(),
  ]);

  const skillOptions = catalogue
    .filter((skill) => skill.isActive)
    .map((skill) => ({ id: skill.id, name: skill.name }));

  const verified = projects.filter((p) => p.verificationStatus === "VERIFIED").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Projects"
        description="Your portfolio. Submit a project for verification and a reviewer will confirm the work is yours."
      />

      <dl className="stagger grid gap-4 sm:grid-cols-3">
        <Stat label="Projects" value={projects.length} />
        <Stat label="Verified" value={verified} />
        <Stat
          label="Awaiting review"
          value={projects.filter((p) => p.verificationStatus === "UNDER_REVIEW").length}
        />
      </dl>

      <ProjectList projects={projects} skillOptions={skillOptions} />

      <Card className="space-y-4">
        <div>
          <CardTitle>Add a project</CardTitle>

          <CardDescription>
            Include a repository or live link so a reviewer can verify it.
          </CardDescription>
        </div>

        <ProjectForm skillOptions={skillOptions} />
      </Card>
    </div>
  );
}
