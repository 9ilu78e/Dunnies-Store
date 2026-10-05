import { NextRequest, NextResponse } from "next/server";
import { getAdminActor } from "@/lib/adminUsersAccess";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { createContactNotificationEmail } from "@/lib/emails/contactNotificationEmail";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (
      !name ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !subject ||
      !message
    ) {
      return NextResponse.json(
        { error: "Name, valid email, subject, and message are required." },
        { status: 400 }
      );
    }
    if (
      name.length > 160 ||
      email.length > 254 ||
      phone.length > 40 ||
      subject.length > 200 ||
      message.length > 10000
    ) {
      return NextResponse.json(
        { error: "One or more fields exceed the allowed length." },
        { status: 400 }
      );
    }

    const contactMessage = await prisma.contactMessage.create({
      data: { name, email, phone: phone || null, subject, message },
    });

    const [userAdmins, firebaseAdmins] = await Promise.all([
      prisma.user.findMany({
        where: { role: { equals: "admin", mode: "insensitive" } },
        select: { id: true, email: true, fullName: true },
      }),
      prisma.firebaseUser.findMany({
        where: { role: { equals: "admin", mode: "insensitive" } },
        select: { uid: true, email: true, name: true },
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
            title: "New contact message",
            message: `${name} sent a message: ${subject}`,
            link: "/admin/contact-messages",
          })),
        });
      } catch (notificationError) {
        console.error("[CONTACT_MESSAGE_ADMIN_NOTIFICATION]", notificationError);
      }
    }

    const adminRecipients = Array.from(
      new Map(
        [...userAdmins, ...firebaseAdmins].map((admin) => [
          admin.email.toLowerCase(),
          { email: admin.email, name: "fullName" in admin ? admin.fullName : admin.name },
        ])
      ).values()
    );
    const emailResults = await Promise.allSettled(
      adminRecipients.map(({ email: adminEmail, name: adminName }) =>
        sendEmail({
          to: adminEmail,
          subject: `New contact message: ${subject}`,
          html: createContactNotificationEmail({
            adminName,
            name,
            email,
            phone,
            subject,
            message,
            inboxUrl: `${new URL(request.url).origin}/admin/contact-messages`,
          }),
        })
      )
    );
    emailResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error("[CONTACT_MESSAGE_ADMIN_EMAIL]", {
          email: adminRecipients[index].email,
          error: result.reason,
        });
      }
    });

    return NextResponse.json(
      {
        message: "Your message has been sent. Our team will be in touch.",
        emailFailures: emailResults.filter((result) => result.status === "rejected")
          .length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CONTACT_MESSAGE_POST]", error);
    return NextResponse.json(
      { error: "Unable to send your message right now. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const actor = await getAdminActor(request);
    if (!actor) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const messages = await prisma.contactMessage.findMany({
      orderBy: [{ isReviewed: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[CONTACT_MESSAGES_GET]", error);
    return NextResponse.json(
      { error: "Unable to load contact messages." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await getAdminActor(request);
    if (!actor) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = (await request.json()) as {
      id?: unknown;
      isReviewed?: unknown;
    };
    if (
      typeof body.id !== "string" ||
      !body.id.trim() ||
      typeof body.isReviewed !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Message ID and reviewed state are required." },
        { status: 400 }
      );
    }
    const message = await prisma.contactMessage.update({
      where: { id: body.id },
      data: { isReviewed: body.isReviewed },
    });
    return NextResponse.json({ message });
  } catch (error) {
    console.error("[CONTACT_MESSAGES_PATCH]", error);
    return NextResponse.json(
      { error: "Unable to update contact message." },
      { status: 500 }
    );
  }
}
