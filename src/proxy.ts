import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(request) {
    const role = request.nextauth.token?.role;
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/admin") && role !== "SUPERADMIN") {
      return NextResponse.redirect(
        new URL(role === "GUARDIAN" ? "/" : "/login", request.url),
      );
    }

    if (pathname === "/" && role !== "GUARDIAN") {
      return NextResponse.redirect(
        new URL(role === "SUPERADMIN" ? "/admin" : "/login", request.url),
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|register|forgot-password|reset-password|logo.png).*)",
  ],
};
