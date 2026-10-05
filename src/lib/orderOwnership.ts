import { prisma } from "@/lib/prisma";

type AuthenticatedOrderUser = {
  id: string;
  email: string;
  role: string;
};

export async function canAccessOrder(
  user: AuthenticatedOrderUser,
  order: { userId: string | null }
) {
  if (user.role.toLowerCase() === "admin" || order.userId === user.id) {
    return true;
  }

  const account = await prisma.user.findFirst({
    where: {
      email: { equals: user.email.trim(), mode: "insensitive" },
    },
    select: { id: true },
  });

  return account?.id === order.userId;
}
