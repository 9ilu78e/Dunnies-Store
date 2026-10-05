import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { DEFAULT_SITE_SETTINGS } from "@/lib/siteSettings";
import { createNewsletterSubscriptionEmail } from "@/lib/emails/newsletterSubscriptionEmail";


export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: unknown };
    if (typeof body.email !== "string") {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const email = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email },
      update: { isSubscribed: true, subscribedAt: new Date(), unsubscribedAt: null },
    });

    const [userAdmins, firebaseAdmins] = await Promise.all([
      prisma.user.findMany({
        where: { role: { equals: "admin", mode: "insensitive" } },
        select: { id: true },
      }),
      prisma.firebaseUser.findMany({
        where: { role: { equals: "admin", mode: "insensitive" } },
        select: { uid: true },
      }),
    ]);
    const adminAccountIds = Array.from(
      new Set([
        ...userAdmins.map((admin) => admin.id),
        ...firebaseAdmins.map((admin) => admin.uid),
      ])
    );
    if (adminAccountIds.length > 0) {
      try {
        await prisma.notification.createMany({
          data: adminAccountIds.map((accountId) => ({
            recipientRole: "admin",
            accountId,
            title: "New newsletter subscriber",
            message: `${email} subscribed to the newsletter.`,
            link: "/admin/newsletter",
          })),
        });
      } catch (notificationError) {
        console.error("[NEWSLETTER_ADMIN_NOTIFICATION]", notificationError);
      }
    }

    let confirmationEmailSent = true;
    try {
      let storeName = DEFAULT_SITE_SETTINGS.storeName;
      let supportEmail = DEFAULT_SITE_SETTINGS.supportEmail;
      try {
        const settings = await prisma.$queryRaw<
          Array<{ storeName: string; supportEmail: string }>
        >`
          SELECT "storeName", "supportEmail"
          FROM "SiteSettings"
          WHERE "id" = 'main'
          LIMIT 1
        `;
        if (settings[0]) {
          storeName = settings[0].storeName;
          supportEmail = settings[0].supportEmail;
        }
      } catch (settingsError) {
        console.error("[NEWSLETTER_SITE_SETTINGS]", settingsError);
      }
      await sendEmail({
        to: email,
        subject: `You’re subscribed to ${storeName}`,
        html: createNewsletterSubscriptionEmail(email, storeName, supportEmail),
      });
    } catch (emailError) {
      confirmationEmailSent = false;
      console.error("[NEWSLETTER_CONFIRMATION_EMAIL]", {
        email,
        error: emailError,
      });
    }

    return NextResponse.json({
      message: confirmationEmailSent
        ? "You’re subscribed! A confirmation email has been sent."
        : "You’re subscribed, but we couldn’t send the confirmation email. Please try again later or contact support.",
      confirmationEmailSent,
      subscriberId: subscriber.id,
    });
  } catch (error) {
    console.error("[NEWSLETTER_SUBSCRIBE]", error);
    return NextResponse.json(
      { error: "Unable to save your subscription right now." },
      { status: 500 }
    );
  }
}
