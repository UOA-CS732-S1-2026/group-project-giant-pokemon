import { NextResponse } from "next/server";
import { shouldUseSecureCookie } from "@/lib/authCookie";

export async function POST(req: Request) {
  const res = NextResponse.json({ message: "Logged out" });

  // Clear the JWT cookie
  res.cookies.set("token", "", {
    httpOnly: true,
    secure: shouldUseSecureCookie(req),
    path: "/",
    expires: new Date(0), // Expire immediately
  });

  return res;
}
