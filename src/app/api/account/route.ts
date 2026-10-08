import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getFirebaseAdminAuth } from "@/lib/firebaseAdmin";
import { getOrCreateAccountUser } from "@/lib/accountUser";
import { prisma } from "@/lib/prisma";
import { verifyUserAuth } from "@/lib/authMiddleware";

const DEFAULT_NOTIFICATION_PREFERENCES = {
  orderUpdates: true,
  promotions: true,
  newsletter: false,
  smsNotifications: true,
};

function readNotificationPreferences(value: Prisma.JsonValue) {
  const saved =
    value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};

  return {
    orderUpdates:
      typeof saved.orderUpdates === "boolean"
        ? saved.orderUpdates
        : DEFAULT_NOTIFICATION_PREFERENCES.orderUpdates,
    promotions:
      typeof saved.promotions === "boolean"
        ? saved.promotions
        : DEFAULT_NOTIFICATION_PREFERENCES.promotions,
    newsletter:
      typeof saved.newsletter === "boolean"
        ? saved.newsletter
        : DEFAULT_NOTIFICATION_PREFERENCES.newsletter,
    smsNotifications:
      typeof saved.smsNotifications === "boolean"
        ? saved.smsNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.smsNotifications,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const account = await getOrCreateAccountUser(auth.user);
    const firebaseAccount = await prisma.firebaseUser.findUnique({
      where: { uid: auth.user.id },
      select: { photo: true, provider: true },
    });

    if (new URL(request.url).searchParams.get("export") === "true") {
      const [addresses, orders] = await Promise.all([
        prisma.address.findMany({
          where: { userId: account.id },
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        }),
        prisma.order.findMany({
          where: { userId: account.id },
          include: {
            orderItems: {
              include: {
                product: { select: { name: true } },
                gift: { select: { name: true } },
                souvenir: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return NextResponse.json({
        profile: {
          fullName: account.fullName,
          email: account.email,
          phone: account.phone,
          dateOfBirth: account.dateOfBirth,
          gender: account.gender,
        },
        addresses,
        orders,
        notificationPreferences: readNotificationPreferences(
          account.notificationPreferences
        ),
      });
    }

    return NextResponse.json({
      user: {
        id: account.id,
        uid: auth.user.id,
        fullName: account.fullName,
        email: account.email,
        phone: account.phone,
        photoURL: firebaseAccount?.photo ?? null,
        provider:
          auth.user.id === account.id
            ? "database"
            : firebaseAccount?.provider === "email"
            ? "firebase-email"
            : "external",
        dateOfBirth: account.dateOfBirth?.toISOString().slice(0, 10) ?? "",
        gender: account.gender ?? "Prefer not to say",
        notificationPreferences: readNotificationPreferences(
          account.notificationPreferences
        ),
        language: account.language,
        currency: account.currency,
        timeZone: account.timeZone,
      },
    });
  } catch (error) {
    console.error("[ACCOUNT_GET]", error);
    return NextResponse.json({ error: "Unable to load account settings." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const account = await getOrCreateAccountUser(auth.user);
    const body = await request.json();
    const data: Prisma.UserUpdateInput = {};

    if ("firstName" in body || "lastName" in body || "fullName" in body) {
      const fullName =
        typeof body.fullName === "string"
          ? body.fullName.trim()
          : [body.firstName, body.lastName]
              .filter((name): name is string => typeof name === "string")
              .map((name) => name.trim())
              .filter(Boolean)
              .join(" ");

      if (!fullName || fullName.length > 120) {
        return NextResponse.json(
          { error: "Enter a valid name (up to 120 characters)." },
          { status: 400 }
        );
      }
      data.fullName = fullName;
    }

    if ("phone" in body) {
      if (
        body.phone !== null &&
        (typeof body.phone !== "string" || body.phone.length > 40)
      ) {
        return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
      }
      data.phone = typeof body.phone === "string" ? body.phone.trim() || null : null;
    }

    if ("dateOfBirth" in body) {
      if (body.dateOfBirth && typeof body.dateOfBirth !== "string") {
        return NextResponse.json({ error: "Enter a valid date of birth." }, { status: 400 });
      }
      const parsedDate = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
      if (parsedDate && Number.isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Enter a valid date of birth." }, { status: 400 });
      }
      data.dateOfBirth = parsedDate;
    }

    if ("gender" in body) {
      if (
        typeof body.gender !== "string" ||
        !["Male", "Female", "Other", "Prefer not to say"].includes(body.gender)
      ) {
        return NextResponse.json({ error: "Choose a valid gender option." }, { status: 400 });
      }
      data.gender = body.gender;
    }

    if ("notificationPreferences" in body) {
      const preferences = body.notificationPreferences;
      if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) {
        return NextResponse.json({ error: "Notification preferences are invalid." }, { status: 400 });
      }
      const current = readNotificationPreferences(account.notificationPreferences);
      const next = { ...current };
      for (const key of Object.keys(current) as Array<keyof typeof current>) {
        if (key in preferences) {
          if (typeof preferences[key] !== "boolean") {
            return NextResponse.json(
              { error: "Notification preferences must be enabled or disabled." },
              { status: 400 }
            );
          }
          next[key] = preferences[key];
        }
      }
      data.notificationPreferences = next;
    }

    for (const field of ["language", "currency", "timeZone"] as const) {
      if (field in body) {
        const allowed = {
          language: ["English", "Spanish", "French", "German"],
          currency: ["NGN", "USD", "EUR", "GBP"],
          timeZone: ["WAT", "GMT", "EST", "PST"],
        }[field];
        if (typeof body[field] !== "string" || !allowed.includes(body[field])) {
          return NextResponse.json({ error: `Choose a valid ${field}.` }, { status: 400 });
        }
        data[field] = body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid account settings were provided." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: account.id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        notificationPreferences: true,
        language: true,
        currency: true,
        timeZone: true,
      },
    });

    if (data.fullName) {
      await prisma.firebaseUser.updateMany({
        where: { email: { equals: account.email, mode: "insensitive" } },
        data: { name: updated.fullName },
      });
    }

    return NextResponse.json({
      user: {
        ...updated,
        dateOfBirth: updated.dateOfBirth?.toISOString().slice(0, 10) ?? "",
        notificationPreferences: readNotificationPreferences(
          updated.notificationPreferences
        ),
      },
    });
  } catch (error) {
    console.error("[ACCOUNT_PATCH]", error);
    return NextResponse.json({ error: "Unable to update account settings." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyUserAuth(request);
    if (!auth.isAuthenticated || !auth.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (auth.user.role.toLowerCase() === "admin") {
      return NextResponse.json({ error: "Admin accounts cannot be deleted from customer settings." }, { status: 403 });
    }

    const account = await prisma.user.findFirst({
      where: { email: { equals: auth.user.email, mode: "insensitive" } },
      select: { id: true, email: true },
    });
    const firebaseAccount = await prisma.firebaseUser.findFirst({
      where: { email: { equals: auth.user.email, mode: "insensitive" } },
      select: { uid: true },
    });

    if (!account && !firebaseAccount) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    if (firebaseAccount) {
      try {
        await getFirebaseAdminAuth().deleteUser(firebaseAccount.uid);
      } catch (error) {
        console.error("[ACCOUNT_DELETE_FIREBASE]", error);
        return NextResponse.json(
          { error: "Unable to delete the sign-in identity. The account was not changed." },
          { status: 502 }
        );
      }
    }

    await prisma.$transaction(async (transaction) => {
      const chatOwnerFilters = [
        ...(account
          ? [{ userAccountId: account.id, userAccountSource: "user" }]
          : []),
        ...(firebaseAccount
          ? [
              {
                userAccountId: firebaseAccount.uid,
                userAccountSource: "firebaseUser",
              },
            ]
          : []),
      ];
      const accountIds = [
        ...(account ? [account.id] : []),
        ...(firebaseAccount ? [firebaseAccount.uid] : []),
      ];
      const orderOwnerFilters = [
        ...(account ? [{ userId: account.id }] : []),
        { customerEmail: { equals: auth.user.email, mode: "insensitive" as const } },
      ];

      await transaction.order.updateMany({
        where: { OR: orderOwnerFilters },
        data: {
          userId: null,
          customerName: "Deleted account",
          customerEmail: `deleted-${account?.id || firebaseAccount?.uid}@deleted.invalid`,
          customerPhone: "",
          deliveryAddress: "",
          notes: "Customer account deleted.",
        },
      });
      await transaction.notification.deleteMany({
        where: { accountId: { in: accountIds } },
      });
      if (chatOwnerFilters.length > 0) {
        await transaction.liveChatConversation.deleteMany({
          where: { OR: chatOwnerFilters },
        });
      }
      await transaction.emailLog.deleteMany({
        where: { to: { equals: auth.user.email, mode: "insensitive" } },
      });
      if (firebaseAccount) {
        await transaction.firebaseUser.deleteMany({
          where: { uid: firebaseAccount.uid },
        });
      }
      if (account) {
        await transaction.user.delete({ where: { id: account.id } });
      }
    });

    const response = NextResponse.json({ message: "Account deleted successfully." });
    for (const cookie of ["auth_token", "email_verified", "userId"]) {
      response.cookies.set(cookie, "", { path: "/", maxAge: 0 });
    }
    return response;
  } catch (error) {
    console.error("[ACCOUNT_DELETE]", error);
    return NextResponse.json({ error: "Unable to delete account." }, { status: 500 });
  }
}
