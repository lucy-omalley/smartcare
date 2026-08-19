'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Github } from 'lucide-react';
import Link from 'next/link';
import { trackClientError, trackEvent } from '@/lib/analytics';
import { resolveSafePostAuthUrl } from '@/lib/auth/callback-url';
import { AuthLanguageBar } from '@/components/i18n/auth-language-bar';
import { useTranslation } from '@/hooks/use-translation';
import { useAtomValue } from 'jotai';
import { localeAtom } from '@/lib/store/locale';

const RESET_SUCCESS_KEY = 'parenfy_password_reset_success';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    'This email is already registered with email and password. Sign in with email first, then use Google or GitHub.',
  OAuthCallback:
    'Google or GitHub sign-in failed. Check that redirect URLs are configured for this site.',
  OAuthSignin: 'Could not start third-party sign-in. The provider may not be configured yet.',
  Configuration: 'Sign-in is not configured correctly on the server.',
  AccessDenied: 'Sign-in was cancelled.',
  CredentialsSignin: 'Invalid email or password. Please try again.',
};

type AuthProviders = {
  google: boolean;
  github: boolean;
  authConfigured?: boolean;
};

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const locale = useAtomValue(localeAtom);
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [providers, setProviders] = useState<AuthProviders>({
    google: false,
    github: false,
    authConfigured: true,
  });
  const [successMessage, setSuccessMessage] = useState('');

  const postAuthPath = resolveSafePostAuthUrl(searchParams.get('callbackUrl'));

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(RESET_SUCCESS_KEY) === '1') {
      sessionStorage.removeItem(RESET_SUCCESS_KEY);
      setSuccessMessage('Your password was updated. Please sign in with your new password.');
    } else if (searchParams.get('reset') === 'success') {
      setSuccessMessage('Your password was updated. Please sign in with your new password.');
      router.replace('/auth/signin', { scroll: false });
    } else if (searchParams.get('verify') === '1') {
      setSuccessMessage(
        'Account created. We sent a confirmation link — check your inbox and spam/junk folder, then sign in.'
      );
    }

    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(OAUTH_ERROR_MESSAGES[oauthError] ?? 'Sign-in failed. Please try again.');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    window.location.assign(postAuthPath);
  }, [status, postAuthPath]);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/providers')
      .then((response) => response.json())
      .then((data: AuthProviders) => {
        if (!cancelled) setProviders(data);
      })
      .catch(() => {
        if (!cancelled) setProviders({ google: false, github: false, authConfigured: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (providers.authConfigured === false) {
      setError('Sign-in is not configured on the server. NEXTAUTH_SECRET must be set in Vercel.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          callbackUrl: postAuthPath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        trackClientError('auth_login', data.error ?? 'Failed login');
        setError(data.error ?? 'Invalid email or password. Please try again.');
        return;
      }

      trackEvent('login_completed', {
        method: 'email',
        locale,
        is_chinese: locale === 'zh-CN',
      });
      const safePath = resolveSafePostAuthUrl(data.redirect ?? postAuthPath);
      window.location.href = `${window.location.origin}${safePath.startsWith('/') ? safePath : `/${safePath}`}`;
    } catch {
      trackClientError('auth_login', 'Sign in error');
      setError('An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    setError('');

    try {
      await signIn(provider, { callbackUrl: postAuthPath });
    } catch {
      trackClientError('auth_login', `${provider} sign in error`);
      setError(`Could not sign in with ${provider === 'google' ? 'Google' : 'GitHub'}.`);
      setOauthLoading(null);
    }
  };

  const showOAuthSection = providers.google || providers.github;

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <AuthLanguageBar />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t('auth.welcomeBack')}</CardTitle>
          <CardDescription className="text-center">
            {searchParams.get('verify') === '1'
              ? t('auth.signInSubtitle')
              : searchParams.get('registered')
                ? t('auth.signInSubtitle')
                : t('auth.signInSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || oauthLoading !== null}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || oauthLoading !== null}
              />
            </div>
            {successMessage && (
              <div className="text-sm text-green-600 dark:text-green-400">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || oauthLoading !== null}
            >
              {isLoading ? t('auth.signingIn') : t('auth.signInEmail')}
            </Button>
          </form>
          {showOAuthSection && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t('auth.orContinue')}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {providers.google && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isLoading || oauthLoading !== null}
                    onClick={() => handleOAuthSignIn('google')}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {oauthLoading === 'google' ? 'Redirecting to Google...' : 'Continue with Google'}
                  </Button>
                )}
                {providers.github && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isLoading || oauthLoading !== null}
                    onClick={() => handleOAuthSignIn('github')}
                  >
                    <Github className="w-5 h-5 mr-2" />
                    {oauthLoading === 'github' ? 'Redirecting to GitHub...' : 'Continue with GitHub'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full opacity-60"
                  disabled
                  title="Coming soon"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.96-3.24-1.44-1.56-.62-2.46-1.02-2.46-2.02 0-1.02.82-1.67 2.04-1.67.58 0 1.08.19 1.49.57.28.26.52.59.72.98l1.08-.45c-.24-.56-.58-1.04-1.02-1.42-.66-.58-1.52-.88-2.47-.88-1.98 0-3.32 1.22-3.32 2.92 0 1.78 1.38 2.38 3.02 3.02 1.18.47 2.28.92 3.01 1.67.74.76 1.1 1.71 1.1 2.83 0 2.18-1.65 3.58-4.16 3.58-1.38 0-2.52-.42-3.45-1.18-.64-.52-1.16-1.2-1.52-2.01l1.12-.46c.28.74.68 1.34 1.22 1.78.72.58 1.62.88 2.63.88 1.72 0 2.82-1.02 2.82-2.38 0-1.28-.98-1.88-2.58-2.48zM12.03 3.5c-3.58 0-6.5 2.85-6.5 6.37 0 4.04 3.28 6.37 6.5 6.37s6.5-2.33 6.5-6.37c0-3.52-2.92-6.37-6.5-6.37z" />
                  </svg>
                  Apple Sign In (Coming Soon)
                </Button>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <div className="text-sm text-center text-muted-foreground w-full">
            {t('auth.noAccount')}{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              {t('auth.register')}
            </Link>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            By signing in you agree to our{' '}
            <Link href="/terms" className="underline">Terms</Link> and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
