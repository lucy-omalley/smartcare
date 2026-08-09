import type { Provider } from "next-auth/providers";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-url";

function oauthProfileName(
  name: string | null | undefined,
  email: string | null | undefined
): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const localPart = email?.split("@")[0]?.trim();
  return localPart || "Parenfy user";
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export function isGitHubOAuthConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_ID?.trim() && process.env.GITHUB_SECRET?.trim()
  );
}

export function buildAuthProviders(): Provider[] {
  const providers: Provider[] = [];

  if (isGoogleOAuthConfigured()) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        allowDangerousEmailAccountLinking: true,
        profile(profile) {
          return {
            id: profile.sub,
            name: oauthProfileName(profile.name, profile.email),
            email: profile.email?.toLowerCase(),
            image: profile.picture,
          };
        },
      })
    );
  }

  if (isGitHubOAuthConfigured()) {
    providers.push(
      GitHubProvider({
        clientId: process.env.GITHUB_ID!,
        clientSecret: process.env.GITHUB_SECRET!,
        allowDangerousEmailAccountLinking: true,
        profile(profile) {
          const email = profile.email?.toLowerCase() ?? null;
          return {
            id: profile.id.toString(),
            name: oauthProfileName(profile.name ?? profile.login, email),
            email,
            image: profile.avatar_url,
          };
        },
      })
    );
  }

  providers.push(
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await withDbRetry(() =>
          prisma.user.findUnique({
            where: { email },
          })
        );

        if (!user?.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    })
  );

  return providers;
}
