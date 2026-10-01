import { NextRequest, NextResponse } from "next/server";
import { getAdminActor, type AdminAccountSource } from "@/lib/adminUsersAccess";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const actor = await getAdminActor(request);
    if (!actor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const source = request.nextUrl.searchParams.get("source");
    if (source !== "user" && source !== "firebaseUser") {
      return NextResponse.json(
        { error: "Valid account source is required" },
        { status: 400 }
      );
    }
    const accountSource = source as AdminAccountSource;

    if (actor.id === id && actor.source === accountSource) {
      return NextResponse.json(
        { error: "You cannot remove your own admin account" },
        { status: 400 }
      );
    }

    const deleted = await prisma.$transaction(async (transaction) => {
      const target =
        accountSource === "user"
          ? await transaction.user.findUnique({ where: { id }, select: { role: true } })
          : await transaction.firebaseUser.findUnique({ where: { id }, select: { role: true } });
      if (!target) return false;

      if (target.role.toLowerCase() === "admin") {
        const [userAdmins, firebaseAdmins] = await Promise.all([
          transaction.user.count({ where: { role: { equals: "admin", mode: "insensitive" } } }),
          transaction.firebaseUser.count({ where: { role: { equals: "admin", mode: "insensitive" } } }),
        ]);
        if (userAdmins + firebaseAdmins <= 1) {
          throw new Error("LAST_ADMIN");
        }
      }

      if (accountSource === "user") {
        await transaction.user.delete({ where: { id } });
      } else {
        await transaction.firebaseUser.delete({ where: { id } });
      }
      return true;
    });

    if (!deleted) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Account removed" });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ADMIN") {
      return NextResponse.json(
        { error: "The last admin account cannot be removed" },
        { status: 409 }
      );
    }
    console.error("[ADMIN_USERS_DELETE]", error);
    return NextResponse.json(
      { error: "Unable to remove account" },
      { status: 500 }
    );
  }
}
