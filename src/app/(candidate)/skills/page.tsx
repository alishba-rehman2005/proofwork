import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, CardDescription, CardTitle, PageHeader, Stat } from "@/components/ui";
import {
  AddSkillForm,
  SkillRequestForm,
  SkillTable,
} from "@/features/skills/components/skill-manager";
import {
  getAvailableSkills,
  getCandidateIdForUser,
  getCandidateSkills,
} from "@/features/skills/server/skills.queries";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Skills",
};

export default async function SkillsPage() {
  const user = await requireRole([APP_ROLES.CANDIDATE]);

  const candidateId = await getCandidateIdForUser(user.id);

  if (!candidateId) {
    notFound();
  }

  const [rows, available] = await Promise.all([
    getCandidateSkills(candidateId),
    getAvailableSkills(candidateId),
  ]);

  const verified = rows.filter((row) => row.verificationStatus === "VERIFIED");
  const inProgress = rows.filter((row) =>
    ["ASSESSMENT_ASSIGNED", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW"].includes(
      row.verificationStatus,
    ),
  );

  const averageScore =
    verified.length > 0
      ? Math.round(
          verified.reduce((total, row) => total + Number(row.currentScore ?? 0), 0) /
            verified.length,
        )
      : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Skills"
        description="Add the skills you want to prove, then request a practical assessment to have them verified."
      />

      <dl className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total skills" value={rows.length} />
        <Stat label="Verified" value={verified.length} />
        <Stat label="In progress" value={inProgress.length} />
        <Stat label="Average score" value={averageScore === null ? "—" : `${averageScore}/100`} />
      </dl>

      <Card className="space-y-4">
        <div>
          <CardTitle>Your skills</CardTitle>

          <CardDescription>
            A skill stays unverified until a reviewer approves your assessment submission.
          </CardDescription>
        </div>

        <SkillTable rows={rows} />
      </Card>

      <Card className="space-y-4">
        <CardTitle>Add a skill</CardTitle>

        <AddSkillForm available={available} />
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Missing something?</CardTitle>

          <CardDescription>
            Suggest a skill for the catalogue and an admin will review it.
          </CardDescription>
        </div>

        <SkillRequestForm />
      </Card>
    </div>
  );
}
