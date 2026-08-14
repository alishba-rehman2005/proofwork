import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/db";
import { roles, userRoles, users } from "@/db/schema";
import { loginSchema } from "@/features/auth/validation/login.schema";

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
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.roles = user.roles ?? [];
        token.primaryRole = user.primaryRole ?? null;
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
