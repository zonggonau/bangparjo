import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        });

        if (!user) return null;

        // ── Path 1: Admin / password-based login ───────────────────────
        if (user.password) {
          // User has a password set — must provide it (admin accounts)
          if (!credentials.password) return null;
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }

        // ── Path 2: Customer OTP login ─────────────────────────────────
        // Requires a valid one-time session token issued after OTP verification.
        // The token must be prefixed with "otp_session:" and exist in the DB.
        const sessionToken = credentials.password as string | undefined;
        if (!sessionToken || !sessionToken.startsWith('otp_session:')) {
          // Block ANY login without a valid OTP session token for passwordless users
          return null;
        }

        const tokenRecord = await prisma.verificationToken.findFirst({
          where: {
            identifier: `otp_session:${user.email}`,
            token: sessionToken,
            expires: { gt: new Date() },
          },
        });

        if (!tokenRecord) return null;

        // Consume the one-time token immediately
        await prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: `otp_session:${user.email}`,
              token: sessionToken,
            },
          },
        }).catch(() => {}); // ignore if already deleted (race condition safety)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
});
