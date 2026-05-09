import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Melindungi dashboard dan API admin
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
    // Kecualikan static files
    "/((?!api/admin|_next/static|_next/image|favicon.ico).*)",
  ],
};
