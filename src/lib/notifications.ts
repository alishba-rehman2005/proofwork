import { db } from "@/db";
import { activityEvents, notifications } from "@/db/schema";

type NotificationType =
  | "ASSESSMENT_ASSIGNED"
  | "DEADLINE_APPROACHING"
  | "SUBMISSION_RECEIVED"
  | "CHANGES_REQUESTED"
  | "ASSESSMENT_APPROVED"
  | "SKILL_VERIFIED"
  | "SKILL_REJECTED"
  | "REVIEW_ASSIGNED"
  | "TEAM_INVITATION"
  | "SYSTEM";

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
};

/**
 * Queues an in-app notification.
 *
 * Failures are swallowed: a notification is a side effect of the action the
 * user just took, and losing one must not roll back that action. Email
 * delivery is not implemented, so these are in-app only.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      entityType: input.entityType,
      entityId: input.entityId,
    });
  } catch (error) {
    console.error("Failed to queue notification:", input.type, error);
  }
}

type ActivityType =
  | "SKILL_ADDED"
  | "SKILL_VERIFIED"
  | "ASSESSMENT_STARTED"
  | "ASSESSMENT_SUBMITTED"
  | "ASSESSMENT_COMPLETED"
  | "REVIEW_RECEIVED"
  | "PROJECT_CREATED"
  | "PROJECT_VERIFIED"
  | "TEAM_JOINED"
  | "TEAM_CONTRIBUTION_ADDED";

type ActivityInput = {
  candidateId: string;
  type: ActivityType;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Records a candidate activity event.
 *
 * These drive the profile activity feed and the leaderboards, so they are
 * written alongside the state change rather than derived later.
 */
export async function recordActivity(input: ActivityInput): Promise<void> {
  try {
    await db.insert(activityEvents).values({
      candidateId: input.candidateId,
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? null,
    });
  } catch (error) {
    console.error("Failed to record activity:", input.type, error);
  }
}
