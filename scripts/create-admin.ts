import "dotenv/config";

import { randomUUID } from "node:crypto";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { roles, userRoles, users } from "@/db/schema";

/**
 * Creates or promotes an administrator.
 *
 * Admins are never self-registered, so this is the supported way to bootstrap
 * the first one. Run it against a trusted environment only.
 *
 *   npm run admin:create -- admin@example.com 'StrongPass123'
 *
 * Promoting an existing account leaves its password untouched.
 */
async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email) {
    throw new Error("Usage: npm run admin:create -- <email> [password]");
  }

  const normalisedEmail = email.trim().toLowerCase();

  const [adminRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, "ADMIN"))
    .limit(1);

  if (!adminRole) {
    throw new Error("ADMIN role is missing. Run `npm run db:seed` first.");
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalisedEmail))
    .limit(1);

  let userId = existing?.id;

  if (!userId) {
    if (!password) {
      throw new Error("A password is required when creating a new admin account.");
    }

    userId = randomUUID();

    await db.insert(users).values({
      id: userId,
      email: normalisedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      accountStatus: "ACTIVE",
      primaryRoleId: adminRole.id,
    });

    console.log(`Created admin account ${normalisedEmail}`);
  } else {
    await db
      .update(users)
      .set({ accountStatus: "ACTIVE", primaryRoleId: adminRole.id, updatedAt: new Date() })
      .where(eq(users.id, userId));

    console.log(`Promoted existing account ${normalisedEmail} to admin`);
  }

  await db.insert(userRoles).values({ userId, roleId: adminRole.id }).onConflictDoNothing();

  console.log("Done. Sign in and open /admin.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
