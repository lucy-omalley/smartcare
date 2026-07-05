'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    'Sign-in is not configured correctly. Please contact support if this continues.',
  AccessDenied: 'Access was denied. You may have cancelled the sign-in request.',
  Verification: 'The sign-in link has expired or was already used.',
  OAuthSignin:
    'Could not start third-party sign-in. Check that Google or GitHub is configured for this environment.',
  OAuthCallback:
    'Something went wrong during sign-in. Confirm the redirect URL in your Google Cloud Console matches this site.',
  OAuthCreateAccount: 'Could not create an account with this provider.',
  EmailCreateAccount: 'Could not create an account with this email address.',
  Callback: 'Something went wrong during sign-in. Please try again.',
  OAuthAccountNotLinked:
    'This email is already registered with a different sign-in method. Sign in with email first, then link Google or GitHub from your profile.',
  EmailSignin: 'Could not send a sign-in email.',
  CredentialsSignin: 'Invalid email or password.',
  SessionRequired: 'Please sign in to continue.',
  Default: 'An error occurred during sign-in. Please try again.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') ?? 'Default';
  const message = ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default;

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign-in failed</CardTitle>
          <CardDescription className="text-center">{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {errorCode !== 'Default' && (
            <p className="text-xs text-center text-muted-foreground">
              Error code: {errorCode}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/auth/signin">Back to sign in</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/register">Create an account</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
