import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-url";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { persistAnalyticsEvent } from "@/lib/analytics/persist";
import { buildAuthProviders } from "@/lib/auth-providers";
import { resolveSafePostAuthUrl } from "@/lib/auth/callback-url";
import { authorizeOAuthSignIn, markEmailVerifiedForOAuth } from "@/lib/auth/oauth-signin";
import { isEmailVerified } from "@/lib/auth/email-verification";

async function resolveUserIdFromToken(token: {
  id?: string;
  sub?: string;
  email?: string | null;
}): Promise<string | undefined> {
  if (token.id) return token.id;
  if (token.sub) return token.sub;

  const email = token.email?.trim().toLowerCase();
  if (!email) return undefined;

  const user = await withDbRetry(() =>
    prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
  );

  return user?.id;
}

async function syncEmailVerifiedFlag(userId: string): Promise<boolean> {
  const user = await withDbRetry(() =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, isAdmin: true },
    })
  );
  if (!user) return false;
  return isEmailVerified(user);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  secret: process.env.NEXTAUTH_SECRET,
  providers: buildAuthProviders(),
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      const userId = user.id;
      if (!userId) return;

      const method = account?.provider ?? "credentials";
      const tasks: Promise<unknown>[] = [
        persistAnalyticsEvent("login", userId, { method }),
        captureServerEvent(userId, "login", { method }),
        prisma.user.update({
          where: { id: userId },
          data: { lastLoginAt: new Date(), lastActiveAt: new Date() },
        }),
      ];

      if (method !== "credentials") {
        tasks.push(markEmailVerifiedForOAuth(userId));
      }

      if (isNewUser && method !== "credentials") {
        tasks.push(
          persistAnalyticsEvent("signup_completed", userId, { method }),
          captureServerEvent(userId, "signup_completed", { method })
        );
      }

      await Promise.allSettled(tasks);
    },
    async signOut({ token }) {
      const userId = token?.id as string | undefined;
      if (!userId) return;
      await Promise.allSettled([
        persistAnalyticsEvent("logout", userId),
        captureServerEvent(userId, "logout"),
      ]);
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") {
        return true;
      }

      const email = user.email?.trim().toLowerCase();
      if (!email) {
        return "/auth/error?error=OAuthSignin";
      }

      return authorizeOAuthSignIn(email, account.provider, account.providerAccountId, user);
    },
    async jwt({ token, user, account, trigger }) {
      if (user?.id) {
        token.sub = user.id;
        token.id = user.id;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        token.picture = user.image ?? token.picture;
        token.emailVerified = await syncEmailVerifiedFlag(user.id);
        return token;
      }

      if (account?.provider === "credentials" && token.sub) {
        token.id = token.sub;
        token.emailVerified = await syncEmailVerifiedFlag(token.sub);
        return token;
      }

      const resolvedId = await resolveUserIdFromToken(token);
      if (resolvedId) {
        token.sub = token.sub ?? resolvedId;
        token.id = resolvedId;
      }

      if (token.id && (trigger === "update" || token.emailVerified === undefined)) {
        token.emailVerified = await syncEmailVerifiedFlag(token.id as string);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        session.user.image = (token.picture as string | undefined) ?? session.user.image;
        session.user.emailVerified = token.emailVerified === true;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const safePath = resolveSafePostAuthUrl(url, baseUrl);
      if (safePath.startsWith("/")) {
        return `${baseUrl.replace(/\/$/, "")}${safePath}`;
      }
      try {
        const parsed = new URL(safePath);
        if (parsed.origin === new URL(baseUrl).origin) {
          return safePath;
        }
      } catch {
        /* fall through */
      }
      return `${baseUrl.replace(/\/$/, "")}/today`;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
