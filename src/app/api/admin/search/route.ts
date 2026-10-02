import { NextRequest, NextResponse } from "next/server";
import { getAdminActor } from "@/lib/adminUsersAccess";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    if (!(await getAdminActor(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (!query || query.length > 100) {
      return NextResponse.json(
        { error: "Search must contain between 1 and 100 characters" },
        { status: 400 }
      );
    }

    const contains = { contains: query, mode: "insensitive" as const };
    const [products, gifts, souvenirs, categories, orders, users, firebaseUsers] =
      await Promise.all([
        prisma.product.findMany({
          where: { name: contains },
          select: { id: true, name: true },
          take: 3,
          orderBy: { name: "asc" },
        }),
        prisma.gift.findMany({
          where: { name: contains },
          select: { id: true, name: true },
          take: 3,
          orderBy: { name: "asc" },
        }),
        prisma.souvenir.findMany({
          where: { name: contains },
          select: { id: true, name: true },
          take: 3,
          orderBy: { name: "asc" },
        }),
        prisma.category.findMany({
          where: { name: contains },
          select: { id: true, name: true },
          take: 3,
          orderBy: { name: "asc" },
        }),
        prisma.order.findMany({
          where: {
            OR: [
              { id: contains },
              { customerName: contains },
              { customerEmail: contains },
            ],
          },
          select: { id: true, customerName: true, customerEmail: true },
          take: 3,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
          where: { OR: [{ fullName: contains }, { email: contains }] },
          select: { id: true, fullName: true, email: true },
          take: 3,
          orderBy: { createdAt: "desc" },
        }),
        prisma.firebaseUser.findMany({
          where: { OR: [{ name: contains }, { email: contains }] },
          select: { id: true, name: true, email: true },
          take: 3,
          orderBy: { createdAt: "desc" },
        }),
      ]);

    const results = [
      ...products.map((item) => ({
        id: item.id,
        title: item.name,
        type: "Product",
        href: "/manage-products",
      })),
      ...gifts.map((item) => ({
        id: item.id,
        title: item.name,
        type: "Gift",
        href: "/manage-gifts",
      })),
      ...souvenirs.map((item) => ({
        id: item.id,
        title: item.name,
        type: "Souvenir",
        href: "/manage-souvenirs",
      })),
      ...categories.map((item) => ({
        id: item.id,
        title: item.name,
        type: "Category",
        href: "/manage-categories",
      })),
      ...orders.map((item) => ({
        id: item.id,
        title: item.customerName,
        detail: `${item.id} · ${item.customerEmail}`,
        type: "Order",
        href: "/manage-orders",
      })),
      ...users.map((item) => ({
        id: item.id,
        title: item.fullName,
        detail: item.email,
        type: "User",
        href: "/manage-users",
      })),
      ...firebaseUsers.map((item) => ({
        id: item.id,
        title: item.name,
        detail: item.email,
        type: "User",
        href: "/manage-users",
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[ADMIN_SEARCH_GET]", error);
    return NextResponse.json(
      { error: "Unable to search admin records" },
      { status: 500 }
    );
  }
}
