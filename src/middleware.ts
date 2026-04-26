import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/jwt";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;
  const token = req.cookies.get("advancia_session")?.value;
  const session = await verifySession(token);

  const protectedUser = path.startsWith("/dashboard");
  const protectedAdmin = path.startsWith("/admin");
  const protectedSuper = path.startsWith("/super-admin");

  if (protectedUser || protectedAdmin || protectedSuper) {
    if (!session) {
      const u = new URL("/login", req.url);
      u.searchParams.set("next", path);
      return NextResponse.redirect(u);
    }
    if (protectedAdmin && !["admin", "super_admin"].includes(session.role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (protectedSuper && session.role !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/super-admin/:path*"]
};
