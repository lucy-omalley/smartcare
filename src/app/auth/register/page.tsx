'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import { getStoredReferralSource } from '@/lib/analytics/referral-capture';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RecaptchaWidget,
  isRecaptchaEnabledClient,
  isCaptchaEnabledClient,
  type RecaptchaWidgetHandle,
} from '@/components/auth/recaptcha-widget';
import { TurnstileWidget, isTurnstileEnabledClient } from '@/components/auth/turnstile-widget';

export default function Register() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const formLoadedAtRef = useRef(Date.now());
  const recaptchaRef = useRef<RecaptchaWidgetHandle>(null);
  const useRecaptcha = isRecaptchaEnabledClient();
  const useTurnstile = !useRecaptcha && isTurnstileEnabledClient();
  const captchaRequired = isCaptchaEnabledClient();

  useEffect(() => {
    formLoadedAtRef.current = Date.now();
  }, []);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    if (captchaRequired && !captchaToken) {
      setError('Please complete the CAPTCHA verification.');
      setIsLoading(false);
      return;
    }

    trackEvent('signup_started');

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const honeypot = (formData.get('website') as string) ?? '';

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          referralSource: getStoredReferralSource(),
          recaptchaToken: useRecaptcha ? captchaToken : undefined,
          turnstileToken: useTurnstile ? captchaToken : undefined,
          honeypot,
          formLoadedAt: formLoadedAtRef.current,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Registration failed');
      }

      trackEvent('signup_completed', { method: 'email' });
      router.push('/auth/signin?registered=true');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
      setCaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Join the Public Beta</CardTitle>
          <CardDescription className="text-center">
            Create your Parenfy account. Parenfy is still improving — your feedback helps shape the product.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div
              className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
              aria-hidden="true"
              tabIndex={-1}
            >
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" type="text" autoComplete="off" tabIndex={-1} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                required
                minLength={2}
                maxLength={80}
                disabled={isLoading}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            {useRecaptcha ? (
              <RecaptchaWidget
                ref={recaptchaRef}
                onVerify={handleCaptchaVerify}
                onExpire={handleCaptchaExpire}
                onError={handleCaptchaExpire}
              />
            ) : useTurnstile ? (
              <TurnstileWidget
                onVerify={handleCaptchaVerify}
                onExpire={handleCaptchaExpire}
                onError={handleCaptchaExpire}
              />
            ) : null}
            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || (captchaRequired && !captchaToken)}
            >
              {isLoading ? 'Creating account...' : 'Join the Public Beta'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="underline">Terms</Link> and{' '}
              <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
