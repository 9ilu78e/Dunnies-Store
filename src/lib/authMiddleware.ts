import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getFirebaseAdminAuth } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";

type AuthenticatedUser = {
  id: string;
  source: "user" | "firebaseUser";
  email: string;
  fullName: string;
  role: string;
};

/**
 * Verify if user is authenticated by checking token and user existence
 */
export async function verifyUserAuth(request: NextRequest) {
  try {
    const token =
      request.cookies.get("auth_token")?.value ||
      request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");

    if (token) {
      try {
        const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
        const account = await prisma.firebaseUser.findUnique({
          where: { uid: decoded.uid },
        });

        if (account) {
          return {
            isAuthenticated: true,
            user: {
              id: account.uid,
              source: "firebaseUser",
              email: account.email,
              fullName: account.name,
              role: account.role,
            } satisfies AuthenticatedUser,
            error: null,
          };
        }
      } catch {
        try {
          const decoded = jwt.verify(
            token,
            process.env.NEXTAUTH_SECRET || "your-secret-key"
          );
          if (
            typeof decoded !== "string" &&
            typeof decoded.userId === "string"
          ) {
            const account = await prisma.user.findUnique({
              where: { id: decoded.userId },
            });

            if (account) {
              return {
                isAuthenticated: true,
                user: {
                  id: account.id,
                  source: "user",
                  email: account.email,
                  fullName: account.fullName,
                  role: account.role,
                } satisfies AuthenticatedUser,
                error: null,
              };
            }
          }
        } catch (error) {
          console.error("Authentication token verification failed:", error);
        }
      }
    }

    const verifiedEmail = request.cookies.get("email_verified")?.value;
    const userId = request.cookies.get("userId")?.value;
    if (verifiedEmail && userId) {
      const account = await prisma.firebaseUser.findFirst({
        where: {
          email: {
            equals: decodeURIComponent(verifiedEmail),
            mode: "insensitive",
          },
          uid: userId,
        },
      });

      if (account) {
        return {
          isAuthenticated: true,
          user: {
            id: account.uid,
            source: "firebaseUser",
            email: account.email,
            fullName: account.name,
            role: account.role,
          } satisfies AuthenticatedUser,
          error: null,
        };
      }
    }

    return {
      isAuthenticated: false,
      user: null,
      error: "No valid authenticated session found",
    };
  } catch (error) {
    console.error("Auth verification error:", error);
    return {
      isAuthenticated: false,
      user: null,
      error: "Authentication verification failed",
    };
  }
}

/**
 * Verify and return unauthorized response
 */
export function unauthorizedResponse(message: string = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}
