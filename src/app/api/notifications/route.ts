import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUserAuth } from "@/lib/authMiddleware";

async function getNotificationAccountIds(user: { id: string; email: string }) {
  const databaseUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });

  const accountIds = [user.id, databaseUser?.id].filter(
    (accountId): accountId is string => accountId !== undefined
  );

  return Array.from(new Set(accountIds));
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
    const notifications = await prisma.notification.findMany({
      where: {
        recipientRole: role,
        accountId: { in: accountIds },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return NextResponse.json({ notifications });
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
    const body = await request.json();
    const notificationId = body.id || body.notificationId;
    if (!notificationId) {
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

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return NextResponse.json({ notification: updatedNotification });
  } catch (error) {
    console.error("[NOTIFICATIONS_POST]", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}
