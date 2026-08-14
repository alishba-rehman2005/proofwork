import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { candidateProfiles, companies, companyMembers, roles, userRoles, users } from "@/db/schema";
import { buildProfileSlug } from "@/features/profiles/utils/slug";
import type { RegisterInput } from "@/features/auth/validation/register.schema";

const BCRYPT_COST = 12;

export type RegisterUserResult =
  | {
      success: true;
      /** Companies land in review, so the caller must not invite them to sign in. */
      requiresApproval: boolean;
      user: { id: string; email: string };
    }
  | { success: false; code: "EMAIL_EXISTS" | "ROLE_MISSING" };

async function findRoleId(name: string): Promise<string | null> {
  const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, name)).limit(1);

  return role?.id ?? null;
}

async function emailTaken(email: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return Boolean(existing);
}

/**
 * Creates an account for one of the two self-service account types.
 *
 * Candidates are active immediately. Company recruiters are created PENDING
 * along with their company, because a recruiter account can read candidate
 * data and anyone can claim to represent a company; an admin approves both
 * before the account can sign in.
 */
export async function registerUser(input: RegisterInput): Promise<RegisterUserResult> {
  const email = input.email.trim().toLowerCase();

  if (await emailTaken(email)) {
    return { success: false, code: "EMAIL_EXISTS" };
  }

  const roleName = input.accountType === "CANDIDATE" ? "CANDIDATE" : "RECRUITER";
  const roleId = await findRoleId(roleName);

  if (!roleId) {
    console.error(`Registration failed because the ${roleName} role is missing.`);

    return { success: false, code: "ROLE_MISSING" };
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const fullName = input.fullName.trim();
  const isCandidate = input.accountType === "CANDIDATE";

  return db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({
        email,
        passwordHash,
        accountStatus: isCandidate ? "ACTIVE" : "PENDING",
        primaryRoleId: roleId,
      })
      .returning({ id: users.id, email: users.email });

    if (!newUser) {
      throw new Error("Failed to create user.");
    }

    await tx.insert(userRoles).values({ userId: newUser.id, roleId });

    if (input.accountType === "CANDIDATE") {
      // The id is generated here rather than by the database so the public
      // slug can be derived from it within the same insert.
      const profileId = randomUUID();

      await tx.insert(candidateProfiles).values({
        id: profileId,
        userId: newUser.id,
        fullName,
        slug: buildProfileSlug(fullName, profileId),
      });
    } else {
      const companyId = randomUUID();
      const companyName = input.companyName.trim();

      await tx.insert(companies).values({
        id: companyId,
        name: companyName,
        slug: buildProfileSlug(companyName, companyId),
        website: input.companyWebsite,
        status: "PENDING",
        createdById: newUser.id,
      });

      await tx.insert(companyMembers).values({
        companyId,
        userId: newUser.id,
        jobTitle: input.jobTitle,
        membershipRole: "OWNER",
      });
    }

    return {
      success: true as const,
      requiresApproval: !isCandidate,
      user: newUser,
    };
  });
}
