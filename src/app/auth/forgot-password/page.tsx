'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset password</CardTitle>
          <CardDescription className="text-center">
            Password reset is coming soon during Public Beta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            For now, please email{' '}
            <a href="mailto:hello@parenfy.com?subject=Password%20reset%20help" className="text-primary hover:underline">
              hello@parenfy.com
            </a>{' '}
            from your registered email and we will help you regain access.
          </p>
          <p>
            If you signed up with Google, use <strong className="text-foreground">Continue with Google</strong> on the
            sign-in page instead.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full rounded-xl">
            <Link href="/auth/signin">Back to sign in</Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-xl">
            <Link href="/contact">Contact support</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
