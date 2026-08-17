import type { Metadata } from "next";

import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/activity/actions";
import { getNotifications } from "@/features/activity/activity";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const user = await requireUser();

  const items = await getNotifications(user.id);
  const unread = items.filter((item) => !item.isRead).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        description="Assessment assignments, review outcomes and platform updates."
        actions={
          unread > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <Button type="submit" variant="secondary" size="sm">
                Mark all read
              </Button>
            </form>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="Nothing yet"
          description="You will be notified when an assessment is assigned or a review completes."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card className={item.isRead ? "opacity-70" : undefined}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.title}</p>

                      {!item.isRead && <Badge tone="solid">New</Badge>}
                    </div>

                    <p className="mt-1 text-sm text-muted">{item.message}</p>

                    <p className="mt-1 text-xs text-faint">{formatDateTime(item.createdAt)}</p>
                  </div>

                  {!item.isRead && (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="notificationId" value={item.id} />

                      <Button type="submit" variant="ghost" size="sm">
                        Mark read
                      </Button>
                    </form>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
