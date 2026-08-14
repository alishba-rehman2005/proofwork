import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { roles, userRoles, users } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";

        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

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
            name: roles.name,
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, user.id));

        return {
          id: user.id,
          email: user.email,
          roles: assignedRoles.map((role) => role.name),
          primaryRoleId: user.primaryRoleId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.roles = user.roles;
        token.primaryRoleId = user.primaryRoleId;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.roles = token.roles as string[];
        session.user.primaryRoleId = (token.primaryRoleId as string | null) ?? null;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
