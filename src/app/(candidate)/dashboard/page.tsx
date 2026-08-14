import type { Metadata } from "next";
import Link from "next/link";

import { getCandidateProfileByUserId } from "@/features/profiles/server/profile.queries";
import { calculateProfileCompleteness } from "@/features/profiles/utils/profile-completeness";
import { APP_ROLES } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireRole([
    APP_ROLES.CANDIDATE,
    APP_ROLES.REVIEWER,
    APP_ROLES.RECRUITER,
    APP_ROLES.ADMIN,
  ]);

  const profile = user.roles.includes(APP_ROLES.CANDIDATE)
    ? await getCandidateProfileByUserId(user.id)
    : null;

  const completeness = profile ? calculateProfileCompleteness(profile) : null;

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-semibold">
          Welcome back{profile ? `, ${profile.fullName}` : ""}
        </h1>

        <p className="mt-2 text-slate-600">
          Signed in as {user.email} &middot; {user.primaryRole ?? "No primary role"}
        </p>
      </header>

      {profile && completeness !== null && (
        <section className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-xl font-semibold">Your profile</h2>

          <p className="mt-2 text-slate-600">
            {completeness === 100
              ? "Your profile is complete."
              : `Your profile is ${completeness}% complete. Adding more detail helps recruiters find you.`}
          </p>

          <div
            className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={completeness}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completeness"
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${completeness}%` }}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
            >
              View profile
            </Link>

            <Link
              href="/profile/edit"
              className="rounded-lg border border-slate-300 px-4 py-2 transition-colors hover:bg-slate-50"
            >
              Edit profile
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 p-5">
        <h2 className="text-xl font-semibold">Skills &amp; assessments</h2>

        <p className="mt-2 text-slate-600">
          Skill verification and assessments arrive in a later phase.
        </p>
      </section>
    </main>
  );
}
