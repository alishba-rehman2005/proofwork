import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import {
  assessmentAssignments,
  assessments,
  candidateProfiles,
  candidateSkills,
  notifications,
} from "@/db/schema";
import { notify } from "@/lib/notifications";

export const runtime = "nodejs";

/** Assignments due within this window get a reminder. */
const WARNING_DAYS = 3;

/** Statuses where the candidate still owes work. */
const OPEN = ["ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED"] as const;

/**
 * Sends "deadline approaching" reminders and expires overdue assignments.
 *
 * Next has no scheduler, so this is an endpoint a platform cron calls. It is
 * protected by CRON_SECRET: without it, anyone could spam every candidate.
 *
 * Idempotent by design - it checks for an existing reminder per assignment
 * before sending, so running it twice in a day does not double-notify.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { message: "CRON_SECRET is not configured on this deployment." },
      { status: 503 },
    );
  }

  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    new URL(request.url).searchParams.get("secret");

  if (provided !== secret) {
    return NextResponse.json({ message: "Unauthorised." }, { status: 401 });
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + WARNING_DAYS * 24 * 60 * 60 * 1000);

  try {
    const dueSoon = await db
      .select({
        assignmentId: assessmentAssignments.id,
        deadline: assessmentAssignments.deadline,
        title: assessments.title,
        userId: candidateProfiles.userId,
      })
      .from(assessmentAssignments)
      .innerJoin(assessments, eq(assessmentAssignments.assessmentId, assessments.id))
      .innerJoin(candidateSkills, eq(assessmentAssignments.candidateSkillId, candidateSkills.id))
      .innerJoin(candidateProfiles, eq(candidateSkills.candidateId, candidateProfiles.id))
      .where(
        and(
          inArray(assessmentAssignments.status, [...OPEN]),
          gte(assessmentAssignments.deadline, now),
          lte(assessmentAssignments.deadline, horizon),
        ),
      );

    // Skip anyone already reminded about this assignment.
    const alreadySent = await db
      .select({ entityId: notifications.entityId })
      .from(notifications)
      .where(eq(notifications.type, "DEADLINE_APPROACHING"));

    const notified = new Set(alreadySent.map((row) => row.entityId));

    let reminded = 0;

    for (const row of dueSoon) {
      if (notified.has(row.assignmentId)) {
        continue;
      }

      const days = Math.max(
        0,
        Math.ceil((row.deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
      );

      await notify({
        userId: row.userId,
        type: "DEADLINE_APPROACHING",
        title: "Deadline approaching",
        message: `${row.title} is due in ${days} day${days === 1 ? "" : "s"}.`,
        entityType: "assignment",
        entityId: row.assignmentId,
      });

      reminded += 1;
    }

    // Overdue work is closed out so it stops appearing as actionable.
    const expired = await db
      .update(assessmentAssignments)
      .set({ status: "EXPIRED", updatedAt: now })
      .where(
        and(
          inArray(assessmentAssignments.status, [...OPEN]),
          lte(assessmentAssignments.deadline, now),
        ),
      )
      .returning({ id: assessmentAssignments.id });

    return NextResponse.json({
      ok: true,
      checked: dueSoon.length,
      reminded,
      expired: expired.length,
    });
  } catch (error) {
    console.error("Deadline cron failed:", error);

    return NextResponse.json({ message: "Deadline job failed." }, { status: 500 });
  }
}
