import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Kosong di sini agar kompatibel dengan Edge (Middleware)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
      const isAccountRoute = nextUrl.pathname.startsWith("/account");
      const isLoginPage = nextUrl.pathname === "/login";

      // If accessing admin dashboard, must be logged in as ADMIN
      if (isDashboardRoute) {
        if (isLoggedIn) {
           const isAdmin = (auth.user as any).role === 'ADMIN';
           if (isAdmin) return true;
           // If user but not admin, kick back to storefront or account
           return Response.redirect(new URL("/account", nextUrl));
        }
        return false; // Redirects to signIn page (/login)
      }

      // If accessing user account, must be logged in
      if (isAccountRoute && !isLoginPage) {
        if (isLoggedIn) return true;
        return false; // Redirects to signIn page (/login)
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'USER';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
