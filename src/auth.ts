import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/db";
import { roles, userRoles, users } from "@/db/schema";
import { loginSchema } from "@/features/auth/validation/login.schema";

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

        if (user.accountStatus !== "ACTIVE") {
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatches) {
          return null;
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
        session.user.primaryRole =
          (token.primaryRole as string | null | undefined) ?? null;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
