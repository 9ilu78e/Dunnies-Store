import { NextRequest, NextResponse } from "next/server";
import { getAdminActor } from "@/lib/adminUsersAccess";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    if (!(await getAdminActor(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        flashSalePrice: true,
        flashSaleEndsAt: true,
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("[ADMIN_FLASH_SALES_GET]", error);
    return NextResponse.json(
      { error: "Unable to load flash sale products" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await getAdminActor(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid flash sale request" },
        { status: 400 }
      );
    }

    if (!("productIds" in body) || !Array.isArray(body.productIds)) {
      return NextResponse.json(
        { error: "Select one or more products" },
        { status: 400 }
      );
    }

    const productIds = body.productIds;
    if (
      productIds.length === 0 ||
      productIds.some((id) => typeof id !== "string" || id.length === 0) ||
      new Set(productIds).size !== productIds.length
    ) {
      return NextResponse.json(
        { error: "Select unique, valid products" },
        { status: 400 }
      );
    }

    const clear = "clear" in body && body.clear === true;
    if (clear) {
      const updatedProducts = await prisma.$transaction(
        productIds.map((id) =>
          prisma.product.update({
            where: { id },
            data: { flashSalePrice: null, flashSaleEndsAt: null },
            select: {
              id: true,
              flashSalePrice: true,
              flashSaleEndsAt: true,
            },
          })
        )
      );
      return NextResponse.json({ products: updatedProducts });
    }

    if (
      !("items" in body) ||
      !Array.isArray(body.items) ||
      !("flashSaleEndsAt" in body) ||
      typeof body.flashSaleEndsAt !== "string"
    ) {
      return NextResponse.json(
        { error: "Sale prices and a shared sale end time are required" },
        { status: 400 }
      );
    }

    const endsAt = new Date(body.flashSaleEndsAt);
    if (!Number.isFinite(endsAt.getTime()) || endsAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "Enter a valid future sale end time" },
        { status: 400 }
      );
    }

    const items = body.items;
    if (
      items.length !== productIds.length ||
      items.some(
        (item) =>
          typeof item !== "object" ||
          item === null ||
          !("id" in item) ||
          typeof item.id !== "string" ||
          !("flashSalePrice" in item) ||
          typeof item.flashSalePrice !== "number" ||
          !Number.isFinite(item.flashSalePrice) ||
          item.flashSalePrice <= 0
      ) ||
      new Set(items.map((item) => item.id)).size !== productIds.length ||
      items.some((item) => !productIds.includes(item.id))
    ) {
      return NextResponse.json(
        { error: "Enter a valid sale price for every selected product" },
        { status: 400 }
      );
    }

    const selectedProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true },
    });
    if (selectedProducts.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more selected products could not be found" },
        { status: 404 }
      );
    }

    const regularPrices = new Map(
      selectedProducts.map((product) => [product.id, product.price])
    );
    if (
      items.some(
        (item) => item.flashSalePrice >= (regularPrices.get(item.id) ?? 0)
      )
    ) {
      return NextResponse.json(
        { error: "Each sale price must be lower than its regular price" },
        { status: 400 }
      );
    }

    const priceById = new Map(
      items.map((item) => [item.id, item.flashSalePrice])
    );
    const updatedProducts = await prisma.$transaction(
      productIds.map((id) =>
        prisma.product.update({
          where: { id },
          data: {
            flashSalePrice: priceById.get(id),
            flashSaleEndsAt: endsAt,
          },
          select: {
            id: true,
            flashSalePrice: true,
            flashSaleEndsAt: true,
          },
        })
      )
    );

    return NextResponse.json({ products: updatedProducts });
  } catch (error) {
    console.error("[ADMIN_FLASH_SALES_PATCH]", error);
    return NextResponse.json(
      { error: "Unable to update flash sale" },
      { status: 500 }
    );
  }
}
