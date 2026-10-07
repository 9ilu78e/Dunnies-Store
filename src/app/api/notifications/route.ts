import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserAuth } from "@/lib/authMiddleware";

const DUPLICATE_NOTIFICATION_WINDOW_MS = 10_000;

async function getNotificationAccountIds(user: { id: string; email: string }) {
  const [databaseUsers, firebaseUsers] = await Promise.all([
    prisma.user.findMany({
      where: { email: { equals: user.email, mode: "insensitive" } },
      select: { id: true },
    }),
    prisma.firebaseUser.findMany({
      where: { email: { equals: user.email, mode: "insensitive" } },
      select: { uid: true },
    }),
  ]);
  return Array.from(
    new Set([
      user.id,
      ...databaseUsers.map((account) => account.id),
      ...firebaseUsers.map((account) => account.uid),
    ])
  );
}

type NotificationEvent = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  orderId: string | null;
  createdAt: Date;
  isRead: boolean;
};

function notificationEventKey(notification: NotificationEvent) {
  return JSON.stringify([
    notification.title,
    notification.message,
    notification.link,
    notification.orderId,
  ]);
}

function combineDuplicateNotifications(
  records: NotificationEvent[],
  includeReadState: boolean
) {
  const groups: NotificationEvent[][] = [];
  const groupsByKey = new Map<string, NotificationEvent[][]>();

  for (const record of records) {
    const key = notificationEventKey(record);
    const matchingGroups = groupsByKey.get(key) || [];
    const group = matchingGroups.find(
      (candidate) =>
        Math.abs(
          candidate[0].createdAt.getTime() - record.createdAt.getTime()
        ) <= DUPLICATE_NOTIFICATION_WINDOW_MS
    );

    if (group) {
      group.push(record);
    } else {
      const newGroup = [record];
      groups.push(newGroup);
      matchingGroups.push(newGroup);
      groupsByKey.set(key, matchingGroups);
    }
  }

  return groups.map((group) => {
    const newest = group.reduce((latest, record) =>
      record.createdAt > latest.createdAt ? record : latest
    );
    return includeReadState && group.some((record) => !record.isRead)
      ? { ...newest, isRead: false }
      : newest;
  });
}

async function getDuplicateNotifications(
  accountIds: string[],
  role: string,
  notification: NotificationEvent
) {
  const windowStart = new Date(
    notification.createdAt.getTime() - DUPLICATE_NOTIFICATION_WINDOW_MS
  );
  const windowEnd = new Date(
    notification.createdAt.getTime() + DUPLICATE_NOTIFICATION_WINDOW_MS
  );
  return prisma.notification.findMany({
    where: {
      recipientRole: role,
      accountId: { in: accountIds },
      title: notification.title,
      message: notification.message,
      link: notification.link,
      orderId: notification.orderId,
      createdAt: { gte: windowStart, lte: windowEnd },
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") === "admin" ? "admin" : "user";

    if (role === "admin" && auth.user.role.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const accountIds = await getNotificationAccountIds(auth.user);
    const matchingNotifications = await prisma.notification.findMany({
      where: {
        recipientRole: role,
        accountId: { in: accountIds },
      },
      orderBy: { createdAt: "desc" },
      take: 250,
      select: {
        id: true,
        title: true,
        message: true,
        link: true,
        orderId: true,
        createdAt: true,
        isRead: true,
      },
    });
    const notifications = combineDuplicateNotifications(
      matchingNotifications,
      true
    );
    const visibleNotifications = notifications.slice(0, 25);

    return NextResponse.json({
      notifications: visibleNotifications,
      unreadCount: visibleNotifications.filter((notification) => !notification.isRead).length,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountIds = await getNotificationAccountIds(auth.user);
    const body = (await request.json()) as {
      id?: unknown;
      notificationId?: unknown;
    };
    const notificationId = body.id ?? body.notificationId;
    if (typeof notificationId !== "string" || !notificationId.trim()) {
      return NextResponse.json(
        { error: "Notification ID is required." },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    const recipientRole =
      auth.user.role.toLowerCase() === "admin" ? "admin" : "user";
    if (
      !accountIds.includes(notification.accountId) ||
      notification.recipientRole !== recipientRole
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const duplicates = await getDuplicateNotifications(
      accountIds,
      notification.recipientRole,
      notification
    );
    await prisma.notification.updateMany({
      where: { id: { in: duplicates.map((duplicate) => duplicate.id) } },
      data: { isRead: true },
    });
    const updatedNotification = { ...notification, isRead: true };

    return NextResponse.json({ notification: updatedNotification });
  } catch (error) {
    console.error("[NOTIFICATIONS_POST]", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountIds = await getNotificationAccountIds(auth.user);
    const body = (await request.json()) as {
      id?: unknown;
      notificationId?: unknown;
      deleteAll?: unknown;
    };

    if (body.deleteAll === true) {
      const recipientRole =
        auth.user.role.toLowerCase() === "admin" ? "admin" : "user";
      await prisma.notification.deleteMany({
        where: {
          recipientRole,
          accountId: { in: accountIds },
        },
      });
      return NextResponse.json({ message: "All notifications deleted." });
    }

    const notificationId = body.id ?? body.notificationId;
    if (typeof notificationId !== "string" || !notificationId.trim()) {
      return NextResponse.json(
        { error: "Notification ID is required." },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 }
      );
    }

    const recipientRole =
      auth.user.role.toLowerCase() === "admin" ? "admin" : "user";
    if (
      !accountIds.includes(notification.accountId) ||
      notification.recipientRole !== recipientRole
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const duplicates = await getDuplicateNotifications(
      accountIds,
      notification.recipientRole,
      notification
    );
    await prisma.notification.deleteMany({
      where: { id: { in: duplicates.map((duplicate) => duplicate.id) } },
    });
    return NextResponse.json({ message: "Notification deleted." });
  } catch (error) {
    console.error("[NOTIFICATIONS_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
