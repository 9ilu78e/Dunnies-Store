import { NextRequest, NextResponse } from "next/server";
import { getAdminActor, type AdminAccountSource } from "@/lib/adminUsersAccess";
import { prisma } from "@/lib/prisma";

const accountSources: AdminAccountSource[] = ["user", "firebaseUser"];

export async function GET(request: NextRequest) {
  try {
    if (!(await getAdminActor(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [users, firebaseUsers] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.firebaseUser.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          provider: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    const accounts = [
      ...users.map((user) => ({
        ...user,
        source: "user" as const,
        provider: "password",
      })),
      ...firebaseUsers.map((user) => ({
        id: user.id,
        fullName: user.name,
        email: user.email,
        phone: null,
        role: user.role,
        createdAt: user.createdAt,
        source: "firebaseUser" as const,
        provider: user.provider,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({
      accounts,
      totalUsers: accounts.filter((account) => account.role.toLowerCase() !== "admin").length,
      totalAdmins: accounts.filter((account) => account.role.toLowerCase() === "admin").length,
    });
  } catch (error) {
    console.error("[ADMIN_USERS_GET]", error);
    return NextResponse.json(
      { error: "Unable to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await getAdminActor(request);
    if (!actor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: unknown = await request.json();
    if (
      typeof body !== "object" ||
      body === null ||
      !("id" in body) ||
      typeof body.id !== "string" ||
      !("source" in body) ||
      typeof body.source !== "string" ||
      !accountSources.includes(body.source as AdminAccountSource) ||
      !("role" in body) ||
      (body.role !== "user" && body.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Valid account id, source, and role are required" },
        { status: 400 }
      );
    }

    const { id, role } = body;
    const source = body.source as AdminAccountSource;
    if (actor.id === id && actor.source === source && role !== "admin") {
      return NextResponse.json(
        { error: "You cannot remove your own admin access" },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (transaction) => {
      const target =
        source === "user"
          ? await transaction.user.findUnique({ where: { id }, select: { role: true } })
          : await transaction.firebaseUser.findUnique({ where: { id }, select: { role: true } });
      if (!target) return null;

      if (
        target.role.toLowerCase() === "admin" &&
        role !== "admin"
      ) {
        const [userAdmins, firebaseAdmins] = await Promise.all([
          transaction.user.count({ where: { role: { equals: "admin", mode: "insensitive" } } }),
          transaction.firebaseUser.count({ where: { role: { equals: "admin", mode: "insensitive" } } }),
        ]);
        if (userAdmins + firebaseAdmins <= 1) {
          throw new Error("LAST_ADMIN");
        }
      }

      return source === "user"
        ? transaction.user.update({ where: { id }, data: { role } })
        : transaction.firebaseUser.update({ where: { id }, data: { role } });
    });

    if (!updated) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Role updated", role: updated.role });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ADMIN") {
      return NextResponse.json(
        { error: "The last admin account cannot be demoted" },
        { status: 409 }
      );
    }
    console.error("[ADMIN_USERS_PATCH]", error);
    return NextResponse.json(
      { error: "Unable to update account role" },
      { status: 500 }
    );
  }
}
