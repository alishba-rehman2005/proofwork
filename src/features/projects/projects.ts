import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { projectMedia, projectSkills, projects, skills } from "@/db/schema";

/*
|--------------------------------------------------------------------------
| PROJECT VALIDATION
|--------------------------------------------------------------------------
*/

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || z.url({ protocol: /^https?$/ }).safeParse(value).success,
    "Enter a valid http(s) URL.",
  )
  .transform((value) => (value === "" ? null : value));

export const projectSchema = z.object({
  id: z.uuid().optional(),

  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(150, "Title must not exceed 150 characters."),

  description: z
    .string()
    .trim()
    .min(20, "Describe the project in at least 20 characters.")
    .max(4000),

  coverImageUrl: optionalUrl,
  githubUrl: optionalUrl,
  liveUrl: optionalUrl,
  figmaUrl: optionalUrl,

  skillIds: z.array(z.uuid()).max(12, "Select at most 12 technologies."),
});

export type ProjectInput = z.infer<typeof projectSchema>;

/*
|--------------------------------------------------------------------------
| QUERIES
|--------------------------------------------------------------------------
*/

export type ProjectWithSkills = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
  figmaUrl: string | null;
  verificationStatus: string;
  createdAt: Date;
  skillNames: string[];
  media: { id: string; url: string; caption: string | null }[];
};

/** Portfolio projects for a candidate, newest first. */
export async function getProjectsForCandidate(candidateId: string): Promise<ProjectWithSkills[]> {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.candidateId, candidateId))
    .orderBy(desc(projects.createdAt));

  if (rows.length === 0) {
    return [];
  }

  const ids = rows.map((row) => row.id);

  const [links, media] = await Promise.all([
    db
      .select({ projectId: projectSkills.projectId, name: skills.name })
      .from(projectSkills)
      .innerJoin(skills, eq(projectSkills.skillId, skills.id))
      .where(inArray(projectSkills.projectId, ids)),

    db.select().from(projectMedia).where(inArray(projectMedia.projectId, ids)),
  ]);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    coverImageUrl: row.coverImageUrl,
    githubUrl: row.githubUrl,
    liveUrl: row.liveUrl,
    figmaUrl: row.figmaUrl,
    verificationStatus: row.verificationStatus,
    createdAt: row.createdAt,
    skillNames: links.filter((link) => link.projectId === row.id).map((link) => link.name),
    media: media
      .filter((item) => item.projectId === row.id)
      .map((item) => ({ id: item.id, url: item.url, caption: item.caption })),
  }));
}

/** A single project scoped to its owner. */
export async function getOwnedProject(projectId: string, candidateId: string) {
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.candidateId, candidateId)))
    .limit(1);

  return row ?? null;
}

/** Projects awaiting verification, for the admin queue. */
export async function getProjectsAwaitingVerification() {
  return db
    .select({
      id: projects.id,
      title: projects.title,
      candidateId: projects.candidateId,
      githubUrl: projects.githubUrl,
      liveUrl: projects.liveUrl,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(eq(projects.verificationStatus, "UNDER_REVIEW"))
    .orderBy(desc(projects.createdAt));
}
