import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protect only dashboard routes
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
  ],
};
