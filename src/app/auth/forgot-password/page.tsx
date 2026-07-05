'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    setDevResetUrl('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setMessage(data.message || 'If an account exists with that email, we sent a password reset link.');
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset password</CardTitle>
          <CardDescription className="text-center">
            Enter your email and we&apos;ll send you a link to choose a new password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || Boolean(message)}
                autoComplete="email"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {message && (
              <div className="text-sm text-muted-foreground space-y-2 rounded-xl bg-muted/50 p-3">
                <p>{message}</p>
                {devResetUrl && (
                  <p className="text-xs break-all">
                    Dev mode:{' '}
                    <a href={devResetUrl} className="text-primary underline">
                      {devResetUrl}
                    </a>
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Signed up with Google? Use{' '}
              <Link href="/auth/signin" className="text-primary hover:underline">
                Continue with Google
              </Link>{' '}
              on the sign-in page instead.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            {!message ? (
              <Button type="submit" className="w-full rounded-xl" disabled={isLoading}>
                {isLoading ? 'Sending…' : 'Send reset link'}
              </Button>
            ) : (
              <Button asChild className="w-full rounded-xl">
                <Link href="/auth/signin">Back to sign in</Link>
              </Button>
            )}
            {!message && (
              <Button asChild variant="ghost" className="w-full rounded-xl">
                <Link href="/auth/signin">Back to sign in</Link>
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
