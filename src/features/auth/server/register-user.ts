import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { candidateProfiles, roles, userRoles, users } from "@/db/schema";
import { buildProfileSlug } from "@/features/profiles/utils/slug";

type RegisterUserInput = {
  fullName: string;
  email: string;
  password: string;
};

export type RegisterUserResult =
  | {
      success: true;
      user: {
        id: string;
        email: string;
      };
    }
  | {
      success: false;
      code: "EMAIL_EXISTS" | "CANDIDATE_ROLE_MISSING";
    };

export async function registerUser(input: RegisterUserInput): Promise<RegisterUserResult> {
  const email = input.email.trim().toLowerCase();

  const [existingUser] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return {
      success: false,
      code: "EMAIL_EXISTS",
    };
  }

  const [candidateRole] = await db
    .select({
      id: roles.id,
    })
    .from(roles)
    .where(eq(roles.name, "CANDIDATE"))
    .limit(1);

  if (!candidateRole) {
    return {
      success: false,
      code: "CANDIDATE_ROLE_MISSING",
    };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({
        email,
        passwordHash,
        accountStatus: "ACTIVE",
      })
      .returning({
        id: users.id,
        email: users.email,
      });

    if (!newUser) {
      throw new Error("Failed to create user.");
    }

    await tx.insert(userRoles).values({
      userId: newUser.id,
      roleId: candidateRole.id,
    });

    await tx
      .update(users)
      .set({
        primaryRoleId: candidateRole.id,
      })
      .where(eq(users.id, newUser.id));

    // The id is generated here rather than by the database so the public slug
    // can be derived from it within the same insert.
    const profileId = randomUUID();
    const fullName = input.fullName.trim();

    await tx.insert(candidateProfiles).values({
      id: profileId,
      userId: newUser.id,
      fullName,
      slug: buildProfileSlug(fullName, profileId),
    });

    return {
      success: true as const,
      user: newUser,
    };
  });
}
