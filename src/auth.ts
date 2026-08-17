import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { db } from "@/db";
import { candidateProfiles, roles, userRoles, users } from "@/db/schema";
import { loginSchema } from "@/features/auth/validation/login.schema";
import { buildProfileSlug } from "@/features/profiles/utils/slug";

/**
 * Signals that the password was correct but the account cannot sign in yet.
 *
 * Only thrown after the password has been verified: telling an unauthenticated
 * visitor that an account is pending would confirm the address is registered.
 */
export class AccountNotActiveError extends CredentialsSignin {
  code = "account_not_active";

  constructor(readonly status: string) {
    super();
  }
}

export const ACCOUNT_STATUS_MESSAGES: Record<string, string> = {
  PENDING: "Your account is awaiting approval. We will email you once it is reviewed.",
  SUSPENDED: "This account has been suspended. Contact support if you think this is a mistake.",
  DISABLED: "This account has been disabled. Contact support if you think this is a mistake.",
};

const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
const githubEnabled = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            passwordHash: users.passwordHash,
            accountStatus: users.accountStatus,
            primaryRoleId: users.primaryRoleId,
          })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.passwordHash) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        // Checked after the password so the status is only revealed to someone
        // who already proved they own the account.
        if (user.accountStatus !== "ACTIVE") {
          throw new AccountNotActiveError(user.accountStatus);
        }

        const assignedRoles = await db
          .select({
            id: roles.id,
            name: roles.name,
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, user.id));

        const roleNames = assignedRoles.map((role) => role.name);

        const primaryRole =
          assignedRoles.find((role) => role.id === user.primaryRoleId)?.name ?? null;

        return {
          id: user.id,
          email: user.email,
          roles: roleNames,
          primaryRole,
        };
      },
    }),
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
    ...(githubEnabled
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID!,
            clientSecret: process.env.AUTH_GITHUB_SECRET!,
          }),
        ]
      : []),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") return true;

      const email = user.email?.trim().toLowerCase();
      if (!email) return false;

      const [existingUser] = await db
        .select({
          id: users.id,
          accountStatus: users.accountStatus,
          primaryRoleId: users.primaryRoleId,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        if (existingUser.accountStatus !== "ACTIVE") return false;
        user.id = existingUser.id;
        return true;
      }

      const [candidateRole] = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, "CANDIDATE"))
        .limit(1);

      if (!candidateRole) return false;

      const fullName =
        user.name?.trim() ||
        (typeof profile?.name === "string" ? profile.name.trim() : "ProofWork Member");
      const profileId = randomUUID();

      const localUser = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(users)
          .values({
            email,
            image: user.image,
            accountStatus: "ACTIVE",
            primaryRoleId: candidateRole.id,
          })
          .returning({ id: users.id });

        if (!created) throw new Error("Unable to create the social account.");

        await tx.insert(userRoles).values({ userId: created.id, roleId: candidateRole.id });
        await tx.insert(candidateProfiles).values({
          id: profileId,
          userId: created.id,
          fullName,
          slug: buildProfileSlug(fullName, profileId),
          profileImageUrl: user.image,
        });
        return created;
      });

      user.id = localUser.id;
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const userId = user.id;

        if (!userId) return token;

        token.userId = userId;

        if (user.roles) {
          token.roles = user.roles;
          token.primaryRole = user.primaryRole ?? null;
        } else {
          const assignedRoles = await db
            .select({ id: roles.id, name: roles.name })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, userId));
          const [localUser] = await db
            .select({ primaryRoleId: users.primaryRoleId })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          token.roles = assignedRoles.map((role) => role.name);
          token.primaryRole =
            assignedRoles.find((role) => role.id === localUser?.primaryRoleId)?.name ?? null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.roles = (token.roles as string[] | undefined) ?? [];
        session.user.primaryRole = (token.primaryRole as string | null | undefined) ?? null;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
