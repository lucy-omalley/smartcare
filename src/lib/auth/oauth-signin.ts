import "server-only";

import { prisma } from "@/lib/db";
import { withDbRetry } from "@/lib/db-url";

/**
 * Secure OAuth sign-in — never auto-link OAuth to an existing email/password account.
 * Returns true, false, or an error redirect path.
 */
export async function authorizeOAuthSignIn(
  email: string,
  provider: string,
  providerAccountId: string,
  user: { id?: string }
): Promise<true | string> {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await withDbRetry(() =>
    prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { accounts: { select: { provider: true, providerAccountId: true } } },
    })
  );

  if (!existingUser) {
    return true;
  }

  const linkedForProvider = existingUser.accounts.find((a) => a.provider === provider);

  if (linkedForProvider) {
    if (linkedForProvider.providerAccountId !== providerAccountId) {
      return "/auth/error?error=OAuthAccountNotLinked";
    }
    user.id = existingUser.id;
    return true;
  }

  // Existing email/password account — require sign-in with password first (no takeover)
  if (existingUser.password) {
    return "/auth/error?error=OAuthAccountNotLinked";
  }

  // Email registered under a different OAuth provider
  if (existingUser.accounts.length > 0) {
    return "/auth/error?error=OAuthAccountNotLinked";
  }

  // Orphan row (no password, no OAuth) — allow provider to claim
  user.id = existingUser.id;
  return true;
}

export async function markEmailVerifiedForOAuth(userId: string): Promise<void> {
  await withDbRetry(() =>
    prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    })
  );
}
