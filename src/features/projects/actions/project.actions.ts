"use server";

import { randomUUID } from "node:crypto";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { projectSkills, projects } from "@/db/schema";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { recordActivity } from "@/lib/notifications";

import { buildProfileSlug } from "@/features/profiles/utils/slug";
import { getCandidateIdForUser } from "@/features/skills/server/skills.queries";

import { getOwnedProject, projectSchema } from "../projects";

export type ProjectActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const MAX_PROJECTS = 30;

function revalidateProjects() {
  revalidatePath("/projects");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

async function requireCandidate() {
  const user = await requireRole([APP_ROLES.CANDIDATE]);
  const candidateId = await getCandidateIdForUser(user.id);

  return candidateId ? { user, candidateId } : null;
}

function parseForm(formData: FormData) {
  return projectSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    coverImageUrl: String(formData.get("coverImageUrl") ?? ""),
    githubUrl: String(formData.get("githubUrl") ?? ""),
    liveUrl: String(formData.get("liveUrl") ?? ""),
    figmaUrl: String(formData.get("figmaUrl") ?? ""),
    skillIds: formData.getAll("skillIds").map(String).filter(Boolean),
  });
}

export async function saveProjectAction(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const owner = await requireCandidate();

  if (!owner) {
    return { success: false, message: "We could not find your candidate profile." };
  }

  const parsed = parseForm(formData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Please correct the project.",
      errors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const { id, skillIds, ...values } = parsed.data;

  if (id) {
    const existing = await getOwnedProject(id, owner.candidateId);

    if (!existing) {
      return { success: false, message: "Project not found." };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(projects)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(projects.id, id));

      await tx.delete(projectSkills).where(eq(projectSkills.projectId, id));

      if (skillIds.length > 0) {
        await tx
          .insert(projectSkills)
          .values(skillIds.map((skillId) => ({ projectId: id, skillId })));
      }
    });

    revalidateProjects();

    return { success: true, message: "Project updated." };
  }

  const [existing] = await db
    .select({ total: count() })
    .from(projects)
    .where(eq(projects.candidateId, owner.candidateId));

  if ((existing?.total ?? 0) >= MAX_PROJECTS) {
    return { success: false, message: `You can add up to ${MAX_PROJECTS} projects.` };
  }

  const projectId = randomUUID();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(projects).values({
        id: projectId,
        candidateId: owner.candidateId,
        createdById: owner.user.id,
        slug: buildProfileSlug(values.title, projectId),
        ...values,
      });

      if (skillIds.length > 0) {
        await tx.insert(projectSkills).values(skillIds.map((skillId) => ({ projectId, skillId })));
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false, message: "You already have a project with that name." };
    }

    throw error;
  }

  await recordActivity({
    candidateId: owner.candidateId,
    type: "PROJECT_CREATED",
    entityType: "project",
    entityId: projectId,
    metadata: { title: values.title },
  });

  revalidateProjects();

  return { success: true, message: "Project added." };
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const owner = await requireCandidate();

  if (!owner) {
    return;
  }

  const id = String(formData.get("id") ?? "");

  if (!z.uuid().safeParse(id).success) {
    return;
  }

  await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.candidateId, owner.candidateId)));

  revalidateProjects();
}

/**
 * Submits a project for verification.
 *
 * Requires a link: a reviewer cannot verify a project they cannot open.
 */
export async function requestProjectVerificationAction(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const owner = await requireCandidate();

  if (!owner) {
    return { success: false, message: "We could not find your candidate profile." };
  }

  const id = String(formData.get("id") ?? "");

  if (!z.uuid().safeParse(id).success) {
    return { success: false, message: "Invalid project reference." };
  }

  const project = await getOwnedProject(id, owner.candidateId);

  if (!project) {
    return { success: false, message: "Project not found." };
  }

  if (!project.githubUrl && !project.liveUrl && !project.figmaUrl) {
    return {
      success: false,
      message: "Add a repository, live or Figma link before requesting verification.",
    };
  }

  if (project.verificationStatus !== "UNVERIFIED" && project.verificationStatus !== "REJECTED") {
    return { success: false, message: "This project is already in review." };
  }

  await db
    .update(projects)
    .set({ verificationStatus: "UNDER_REVIEW", updatedAt: new Date() })
    .where(eq(projects.id, project.id));

  revalidateProjects();
  revalidatePath("/admin");

  return { success: true, message: "Submitted for verification." };
}

/** Admin decision on a project submitted for verification. */
export async function decideProjectVerificationAction(formData: FormData): Promise<void> {
  await requireRole([APP_ROLES.ADMIN, APP_ROLES.REVIEWER]);

  const id = String(formData.get("projectId") ?? "");
  const approve = String(formData.get("decision") ?? "") === "approve";

  if (!z.uuid().safeParse(id).success) {
    return;
  }

  const [project] = await db
    .select({ id: projects.id, candidateId: projects.candidateId, title: projects.title })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.verificationStatus, "UNDER_REVIEW")))
    .limit(1);

  if (!project) {
    return;
  }

  await db
    .update(projects)
    .set({ verificationStatus: approve ? "VERIFIED" : "REJECTED", updatedAt: new Date() })
    .where(eq(projects.id, project.id));

  if (approve && project.candidateId) {
    await recordActivity({
      candidateId: project.candidateId,
      type: "PROJECT_VERIFIED",
      entityType: "project",
      entityId: project.id,
      metadata: { title: project.title },
    });
  }

  revalidateProjects();
  revalidatePath("/admin");
}
