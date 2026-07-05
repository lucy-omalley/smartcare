import type { Provider } from "next-auth/providers";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

const PLACEHOLDER_OAUTH_VALUES = new Set([
  "your-google-client-id",
  "your-google-client-secret",
  "your-github-client-id",
  "your-github-client-secret",
  "your-client-id",
  "your-client-secret",
  "changeme",
  "placeholder",
  "xxx",
]);

const GOOGLE_CLIENT_ID_PATTERN =
  /^\d+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i;

function oauthProfileName(
  name: string | null | undefined,
  email: string | null | undefined
): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const localPart = email?.split("@")[0]?.trim();
  return localPart || "Parenfy user";
}

function isPlaceholderOAuthValue(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  if (PLACEHOLDER_OAUTH_VALUES.has(normalized)) return true;
  return normalized.includes("your-") && normalized.includes("client");
}

function isValidGoogleClientId(clientId: string): boolean {
  return GOOGLE_CLIENT_ID_PATTERN.test(clientId.trim());
}

function isValidGoogleClientSecret(clientSecret: string): boolean {
  const secret = clientSecret.trim();
  return secret.length >= 20 && !isPlaceholderOAuthValue(secret);
}

function isValidGitHubClientId(clientId: string): boolean {
  const id = clientId.trim();
  return /^(Ov23[a-zA-Z0-9]{16,}|Iv1\.[a-zA-Z0-9]{16,}|\d{10,})$/.test(id);
}

function isValidGitHubClientSecret(clientSecret: string): boolean {
  const secret = clientSecret.trim();
  return secret.length >= 20 && !isPlaceholderOAuthValue(secret);
}

export function isGoogleOAuthConfigured(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return false;
  if (isPlaceholderOAuthValue(clientId) || isPlaceholderOAuthValue(clientSecret)) {
    return false;
  }
  return isValidGoogleClientId(clientId) && isValidGoogleClientSecret(clientSecret);
}

export function isGitHubOAuthConfigured(): boolean {
  const clientId = process.env.GITHUB_ID?.trim();
  const clientSecret = process.env.GITHUB_SECRET?.trim();
  if (!clientId || !clientSecret) return false;
  if (isPlaceholderOAuthValue(clientId) || isPlaceholderOAuthValue(clientSecret)) {
    return false;
  }
  return isValidGitHubClientId(clientId) && isValidGitHubClientSecret(clientSecret);
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
          throw new Error("Missing credentials");
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.password) {
          throw new Error("No user found");
        }

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid password");
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
