import type { NextRequest } from "next/server";

export function shouldUseSecureCookie(req?: Request | NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  if (!req) {
    return true;
  }

  const host = req.headers.get("host")?.split(":")[0];
  return host !== "localhost" && host !== "127.0.0.1";
}
