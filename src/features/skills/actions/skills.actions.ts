"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { candidateSkills, skillRequests, skills, verificationRequests } from "@/db/schema";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";
import { recordActivity } from "@/lib/notifications";

import { getCandidateIdForUser } from "../server/skills.queries";
import {
  addCandidateSkillSchema,
  candidateSkillIdSchema,
  skillRequestSchema,
  updateCandidateSkillSchema,
} from "../validation/skill.schema";

export type SkillActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const PROFILE_MISSING: SkillActionState = {
  success: false,
  message: "We could not find your candidate profile.",
};

/** Statuses from which a candidate may still edit or remove a skill. */
const EDITABLE_STATUSES = ["UNVERIFIED", "REJECTED"];

function revalidateSkills() {
  revalidatePath("/skills");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

function validationFailure(error: z.ZodError, message: string): SkillActionState {
  return {
    success: false,
    message,
    errors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  };
}

async function requireCandidate() {
  const user = await requireRole([APP_ROLES.CANDIDATE]);
  const candidateId = await getCandidateIdForUser(user.id);

  return candidateId ? { user, candidateId } : null;
}

/** Loads a candidate skill, scoped to the owner so it cannot be cross-accessed. */
async function getOwnedSkill(candidateSkillId: string, candidateId: string) {
  const [row] = await db
    .select({
      id: candidateSkills.id,
      status: candidateSkills.verificationStatus,
      skillId: candidateSkills.skillId,
    })
    .from(candidateSkills)
    .where(
      and(eq(candidateSkills.id, candidateSkillId), eq(candidateSkills.candidateId, candidateId)),
    )
    .limit(1);

  return row ?? null;
}

export async function addCandidateSkillAction(
  _previousState: SkillActionState,
  formData: FormData,
): Promise<SkillActionState> {
  const owner = await requireCandidate();

  if (!owner) {
    return PROFILE_MISSING;
  }

  const parsed = addCandidateSkillSchema.safeParse({
    skillId: String(formData.get("skillId") ?? ""),
    experienceLevel: String(formData.get("experienceLevel") ?? ""),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error, "Choose a skill and an experience level.");
  }

  const [skill] = await db
    .select({ id: skills.id, name: skills.name, isActive: skills.isActive })
    .from(skills)
    .where(eq(skills.id, parsed.data.skillId))
    .limit(1);

  if (!skill || !skill.isActive) {
    return { success: false, message: "That skill is not available." };
  }

  try {
    await db.insert(candidateSkills).values({
      candidateId: owner.candidateId,
      skillId: parsed.data.skillId,
      experienceLevel: parsed.data.experienceLevel,
    });
  } catch (error) {
    if (isUniqueViolation(error, "candidate_skills_candidate_skill_unique")) {
      return { success: false, message: "That skill is already on your profile." };
    }

    throw error;
  }

  await recordActivity({
    candidateId: owner.candidateId,
    type: "SKILL_ADDED",
    entityType: "skill",
    entityId: skill.id,
    metadata: { skillName: skill.name },
  });

  revalidateSkills();

  return { success: true, message: `${skill.name} added.` };
}

export async function updateCandidateSkillAction(
  _previousState: SkillActionState,
  formData: FormData,
): Promise<SkillActionState> {
  const owner = await requireCandidate();

  if (!owner) {
    return PROFILE_MISSING;
  }

  const parsed = updateCandidateSkillSchema.safeParse({
    candidateSkillId: String(formData.get("candidateSkillId") ?? ""),
    experienceLevel: String(formData.get("experienceLevel") ?? ""),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error, "Choose an experience level.");
  }

  const skill = await getOwnedSkill(parsed.data.candidateSkillId, owner.candidateId);

  if (!skill) {
    return { success: false, message: "Skill not found." };
  }

  await db
    .update(candidateSkills)
    .set({ experienceLevel: parsed.data.experienceLevel, updatedAt: new Date() })
    .where(eq(candidateSkills.id, skill.id));

  revalidateSkills();

  return { success: true, message: "Experience level updated." };
}

export async function removeCandidateSkillAction(formData: FormData): Promise<void> {
  const owner = await requireCandidate();

  if (!owner) {
    return;
  }

  const parsed = candidateSkillIdSchema.safeParse(String(formData.get("candidateSkillId") ?? ""));

  if (!parsed.success) {
    return;
  }

  const skill = await getOwnedSkill(parsed.data, owner.candidateId);

  // A skill mid-verification must not vanish from under the reviewer who is
  // assessing it, so removal is limited to states with no work attached.
  if (!skill || !EDITABLE_STATUSES.includes(skill.status)) {
    return;
  }

  await db.delete(candidateSkills).where(eq(candidateSkills.id, skill.id));

  revalidateSkills();
}

/**
 * Asks for the skill to be verified.
 *
 * Creates a pending request for an admin to triage; the assessment itself is
 * assigned separately, which is what moves the skill out of UNVERIFIED.
 */
export async function requestVerificationAction(
  _previousState: SkillActionState,
  formData: FormData,
): Promise<SkillActionState> {
  const owner = await requireCandidate();

  if (!owner) {
    return PROFILE_MISSING;
  }

  const parsed = candidateSkillIdSchema.safeParse(String(formData.get("candidateSkillId") ?? ""));

  if (!parsed.success) {
    return { success: false, message: "Invalid skill reference." };
  }

  const skill = await getOwnedSkill(parsed.data, owner.candidateId);

  if (!skill) {
    return { success: false, message: "Skill not found." };
  }

  if (!EDITABLE_STATUSES.includes(skill.status)) {
    return { success: false, message: "Verification is already under way for this skill." };
  }

  const [existing] = await db
    .select({ id: verificationRequests.id, status: verificationRequests.status })
    .from(verificationRequests)
    .where(eq(verificationRequests.candidateSkillId, skill.id))
    .limit(1);

  if (existing && ["PENDING", "ASSESSMENT_ASSIGNED", "IN_PROGRESS"].includes(existing.status)) {
    return { success: false, message: "You have already requested verification for this skill." };
  }

  if (existing) {
    await db
      .update(verificationRequests)
      .set({ status: "PENDING", requestedAt: new Date(), updatedAt: new Date(), adminNote: null })
      .where(eq(verificationRequests.id, existing.id));
  } else {
    await db.insert(verificationRequests).values({
      candidateId: owner.candidateId,
      candidateSkillId: skill.id,
      status: "PENDING",
    });
  }

  revalidateSkills();
  revalidatePath("/admin");

  return {
    success: true,
    message: "Verification requested. An assessment will be assigned shortly.",
  };
}

/** Proposes a skill that is missing from the catalogue. */
export async function requestNewSkillAction(
  _previousState: SkillActionState,
  formData: FormData,
): Promise<SkillActionState> {
  const user = await requireRole([APP_ROLES.CANDIDATE]);

  const parsed = skillRequestSchema.safeParse({
    proposedName: String(formData.get("proposedName") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error, "Please correct the skill request.");
  }

  await db.insert(skillRequests).values({
    requestedById: user.id,
    proposedName: parsed.data.proposedName,
    description: parsed.data.description,
    status: "PENDING",
  });

  revalidateSkills();
  revalidatePath("/admin");

  return { success: true, message: "Thanks - an admin will review your suggestion." };
}
