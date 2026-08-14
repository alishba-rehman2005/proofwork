import { db } from "@/db";
import { auditLogs } from "@/db/schema";

type AuditEntry = {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
};

/**
 * Records a privileged action.
 *
 * Approving a company or appointing a reviewer changes who can see candidate
 * data and who can mark a skill Verified, so those decisions need a trail.
 * Failures are logged rather than thrown: losing the audit row should not roll
 * back the action the administrator just took.
 */
export async function recordAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      oldValues: entry.oldValues ?? null,
      newValues: entry.newValues ?? null,
    });
  } catch (error) {
    console.error("Failed to write audit log:", entry.action, error);
  }
}
