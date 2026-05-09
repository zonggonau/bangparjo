import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Kosong di sini agar kompatibel dengan Edge (Middleware)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
      const isLoginPage = nextUrl.pathname === "/login";

      if (isDashboardRoute && !isLoginPage) {
        if (isLoggedIn) return true;
        return false; // Redirect ke login jika belum auth
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
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
