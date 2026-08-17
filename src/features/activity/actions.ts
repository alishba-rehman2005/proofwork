"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";

/** Marks one notification read, scoped to its owner. */
export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const id = String(formData.get("notificationId") ?? "");

  if (!id) {
    return;
  }

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));

  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireUser();

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

  revalidatePath("/notifications");
}
