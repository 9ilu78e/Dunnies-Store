import { NextRequest, NextResponse } from "next/server";
import { getAdminActor } from "@/lib/adminUsersAccess";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getAdminActor(request);
    if (!actor) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = (await request.json()) as {
      subject?: unknown;
      content?: unknown;
    };
    if (
      typeof body.subject !== "string" ||
      typeof body.content !== "string" ||
      !body.subject.trim() ||
      !body.content.trim()
    ) {
      return NextResponse.json(
        { error: "Subject and newsletter content are required." },
        { status: 400 }
      );
    }
    if (body.subject.length > 180 || body.content.length > 50000) {
      return NextResponse.json(
        { error: "Subject or content exceeds the allowed length." },
        { status: 400 }
      );
    }
    const subject = body.subject.trim();

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isSubscribed: true },
      select: { email: true },
      orderBy: { subscribedAt: "asc" },
    });
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937"><h1 style="color:#7e22ce">Dunnis Stores</h1>${escapeHtml(
      body.content.trim()
    )
      .split(/\r?\n/)
      .map((line) => `<p>${line || "&nbsp;"}</p>`)
      .join("")}<p style="color:#6b7280;font-size:12px">You received this email because you subscribed to Dunnis Stores newsletters.</p></div>`;

    let successful = 0;
    let failed = 0;
    for (let start = 0; start < subscribers.length; start += 20) {
      const batch = subscribers.slice(start, start + 20);
      const results = await Promise.allSettled(
        batch.map(({ email }) =>
          sendEmail({ to: email, subject, html })
        )
      );
      successful += results.filter((result) => result.status === "fulfilled").length;
      failed += results.filter((result) => result.status === "rejected").length;
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error("[ADMIN_NEWSLETTER_EMAIL]", {
            email: batch[index].email,
            error: result.reason,
          });
        }
      });
    }

    return NextResponse.json({
      total: subscribers.length,
      successful,
      failed,
      message:
        subscribers.length === 0
          ? "There are no subscribed email addresses yet."
          : `Newsletter sent to ${successful} of ${subscribers.length} subscribers.`,
    });
  } catch (error) {
    console.error("[ADMIN_NEWSLETTER_POST]", error);
    return NextResponse.json(
      { error: "Unable to send the newsletter." },
      { status: 500 }
    );
  }
}
