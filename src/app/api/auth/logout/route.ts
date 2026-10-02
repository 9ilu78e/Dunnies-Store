import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" }, { status: 200 });
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  for (const name of ['auth_token', 'email_verified', 'userId']) {
    for (const path of ['/', '/api/auth']) {
      response.headers.append(
        "Set-Cookie",
        `${name}=; Path=${path}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secure}`
      );
    }
  }

  return response;
}
