"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { candidateProfiles, education, experience, socialLinks } from "@/db/schema";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

import {
  educationSchema,
  experienceSchema,
  profileSchema,
  socialLinkSchema,
} from "../validation/profile.schema";

export type ProfileActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const SOCIAL_LINK_PLATFORM_UNIQUE = "social_links_candidate_platform_unique";

/**
 * Upper bounds on repeatable sections.
 *
 * Nothing in the UI stops a scripted client from inserting unbounded rows, and
 * every one of them is loaded and rendered on the profile page.
 */
const MAX_ENTRIES = {
  education: 30,
  experience: 30,
  socialLinks: 10,
} as const;

const PROFILE_MISSING: ProfileActionState = {
  success: false,
  message: "We could not find your candidate profile. Please contact support.",
};

function revalidateProfile() {
  revalidatePath("/profile");
  revalidatePath("/profile/edit");
}

function validationFailure(error: z.ZodError, message: string): ProfileActionState {
  return {
    success: false,
    message,
    errors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  };
}

/**
 * Resolves the candidate profile owned by the signed-in user.
 *
 * Every mutation below scopes its WHERE clause by the returned `candidateId`,
 * so a caller can never read or modify another candidate's rows.
 */
async function getOwnedCandidateProfile() {
  const user = await requireRole([APP_ROLES.CANDIDATE]);

  const [profile] = await db
    .select({ id: candidateProfiles.id })
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, user.id))
    .limit(1);

  // Registration always creates this row, so a miss means inconsistent data
  // rather than a normal state. Return null and let callers surface a message
  // instead of throwing and rendering a 500 page at the user.
  return profile ? { user, candidateId: profile.id } : null;
}

/** Counts existing rows so a section can be capped before inserting. */
async function isAtLimit(
  table: typeof education | typeof experience | typeof socialLinks,
  candidateId: string,
  limit: number,
): Promise<boolean> {
  const [row] = await db
    .select({ total: count() })
    .from(table)
    .where(eq(table.candidateId, candidateId));

  return (row?.total ?? 0) >= limit;
}

function limitReached(section: string, limit: number): ProfileActionState {
  return {
    success: false,
    message: `You can add up to ${limit} ${section} entries. Remove one before adding another.`,
  };
}

/** Reads a string value from FormData, defaulting to an empty string. */
function field(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

/** Reads an optional row id, treating an empty value as "create a new row". */
function optionalId(formData: FormData): string | undefined {
  return field(formData, "id") || undefined;
}

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const owner = await getOwnedCandidateProfile();

  if (!owner) {
    return PROFILE_MISSING;
  }

  const { candidateId } = owner;

  const availability = field(formData, "availability");

  const parsed = profileSchema.safeParse({
    fullName: field(formData, "fullName"),
    headline: field(formData, "headline"),
    bio: field(formData, "bio"),
    location: field(formData, "location"),
    country: field(formData, "country"),
    city: field(formData, "city"),
    availability: availability === "" ? null : availability,
    profileVisibility: field(formData, "profileVisibility"),
    githubUrl: field(formData, "githubUrl"),
    portfolioUrl: field(formData, "portfolioUrl"),
    websiteUrl: field(formData, "websiteUrl"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error, "Please correct the highlighted fields.");
  }

  await db
    .update(candidateProfiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(candidateProfiles.id, candidateId));

  revalidateProfile();

  return { success: true, message: "Profile updated successfully." };
}

export async function saveEducationAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const owner = await getOwnedCandidateProfile();

  if (!owner) {
    return PROFILE_MISSING;
  }

  const { candidateId } = owner;

  const parsed = educationSchema.safeParse({
    id: optionalId(formData),
    institution: field(formData, "institution"),
    degree: field(formData, "degree"),
    fieldOfStudy: field(formData, "fieldOfStudy"),
    startDate: field(formData, "startDate"),
    endDate: field(formData, "endDate"),
    currentlyStudying: formData.get("currentlyStudying") === "on",
    description: field(formData, "description"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error, "Please correct the education entry.");
  }

  const { id, ...values } = parsed.data;

  const row = {
    ...values,
    endDate: values.currentlyStudying ? null : values.endDate,
  };

  if (id) {
    await db
      .update(education)
      .set({ ...row, updatedAt: new Date() })
      .where(and(eq(education.id, id), eq(education.candidateId, candidateId)));
  } else {
    if (await isAtLimit(education, candidateId, MAX_ENTRIES.education)) {
      return limitReached("education", MAX_ENTRIES.education);
    }

    await db.insert(education).values({ candidateId, ...row });
  }

  revalidateProfile();

  return { success: true, message: "Education saved." };
}

export async function deleteEducationAction(formData: FormData): Promise<void> {
  const owner = await getOwnedCandidateProfile();

  if (!owner) {
    return;
  }

  const { candidateId } = owner;

  const id = field(formData, "id");

  if (!id) {
    return;
  }

  await db
    .delete(education)
    .where(and(eq(education.id, id), eq(education.candidateId, candidateId)));

  revalidateProfile();
}

export async function saveExperienceAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const owner = await getOwnedCandidateProfile();

  if (!owner) {
    return PROFILE_MISSING;
  }

  const { candidateId } = owner;

  const parsed = experienceSchema.safeParse({
    id: optionalId(formData),
    company: field(formData, "company"),
    jobTitle: field(formData, "jobTitle"),
    employmentType: field(formData, "employmentType"),
    location: field(formData, "location"),
    startDate: field(formData, "startDate"),
    endDate: field(formData, "endDate"),
    currentlyWorking: formData.get("currentlyWorking") === "on",
    description: field(formData, "description"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error, "Please correct the experience entry.");
  }

  const { id, ...values } = parsed.data;

  const row = {
    ...values,
    endDate: values.currentlyWorking ? null : values.endDate,
  };

  if (id) {
    await db
      .update(experience)
      .set({ ...row, updatedAt: new Date() })
      .where(and(eq(experience.id, id), eq(experience.candidateId, candidateId)));
  } else {
    if (await isAtLimit(experience, candidateId, MAX_ENTRIES.experience)) {
      return limitReached("experience", MAX_ENTRIES.experience);
    }

    await db.insert(experience).values({ candidateId, ...row });
  }

  revalidateProfile();

  return { success: true, message: "Experience saved." };
}

export async function deleteExperienceAction(formData: FormData): Promise<void> {
  const owner = await getOwnedCandidateProfile();

  if (!owner) {
    return;
  }

  const { candidateId } = owner;

  const id = field(formData, "id");

  if (!id) {
    return;
  }

  await db
    .delete(experience)
    .where(and(eq(experience.id, id), eq(experience.candidateId, candidateId)));

  revalidateProfile();
}

export async function saveSocialLinkAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const owner = await getOwnedCandidateProfile();

  if (!owner) {
    return PROFILE_MISSING;
  }

  const { candidateId } = owner;

  const parsed = socialLinkSchema.safeParse({
    id: optionalId(formData),
    platform: field(formData, "platform"),
    label: field(formData, "label"),
    url: field(formData, "url"),
  });

  if (!parsed.success) {
    return validationFailure(parsed.error, "Please correct the social link.");
  }

  const { id, ...values } = parsed.data;

  try {
    if (id) {
      await db
        .update(socialLinks)
        .set({ ...values, updatedAt: new Date() })
        .where(and(eq(socialLinks.id, id), eq(socialLinks.candidateId, candidateId)));
    } else {
      if (await isAtLimit(socialLinks, candidateId, MAX_ENTRIES.socialLinks)) {
        return limitReached("social link", MAX_ENTRIES.socialLinks);
      }

      await db.insert(socialLinks).values({ candidateId, ...values });
    }
  } catch (error) {
    if (isUniqueViolation(error, SOCIAL_LINK_PLATFORM_UNIQUE)) {
      return {
        success: false,
        message: "You already have a link for this platform.",
      };
    }

    throw error;
  }

  revalidateProfile();

  return { success: true, message: "Social link saved." };
}

export async function deleteSocialLinkAction(formData: FormData): Promise<void> {
  const owner = await getOwnedCandidateProfile();

  if (!owner) {
    return;
  }

  const { candidateId } = owner;

  const id = field(formData, "id");

  if (!id) {
    return;
  }

  await db
    .delete(socialLinks)
    .where(and(eq(socialLinks.id, id), eq(socialLinks.candidateId, candidateId)));

  revalidateProfile();
}
