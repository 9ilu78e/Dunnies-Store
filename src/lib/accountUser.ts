import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function getOrCreateAccountUser(account: {
  id: string;
  email: string;
  fullName: string;
  role: string;
}) {
  const email = account.email.trim().toLowerCase();
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (existingUser) return existingUser;

  return prisma.user.create({
    data: {
      email,
      fullName: account.fullName || email.split("@")[0] || "Customer",
      password: await hashPassword(randomUUID()),
      role: account.role || "user",
    },
  });
}
