import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protect routes based on auth.config.ts
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/api/admin/:path*",
    "/api/cj-orders/:path*",
    "/api/cj-setting/:path*",
    "/api/sync-product-variants/:path*",
  ],
};
