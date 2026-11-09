import { NextRequest, NextResponse } from "next/server";

const WORKSPACE_COOKIE = "boo_ws";

/** Ensures every visitor carries an anonymous workspace id.
 *  The workspaces row is created lazily on first data access. */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get(WORKSPACE_COOKIE)?.value) {
    res.cookies.set(WORKSPACE_COOKIE, `ws_${crypto.randomUUID()}`, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|icon|robots|sitemap).*)"],
};
