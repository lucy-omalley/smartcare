"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function mailProviderUrl(email?: string | null): string | null {
  if (!email) return null;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  if (domain.includes("gmail") || domain.includes("googlemail")) {
    return "https://mail.google.com";
  }
  if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live")) {
    return "https://outlook.live.com/mail";
  }
  if (domain.includes("yahoo")) {
    return "https://mail.yahoo.com";
  }
  if (domain.includes("icloud") || domain.includes("me.com")) {
    return "https://www.icloud.com/mail";
  }
  return `mailto:${email}`;
}

export default function VerifyEmailPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const verified = searchParams.get("verified") === "1";
  const linkError = searchParams.get("error");

  const email = session?.user?.email;
  const openMailUrl = useMemo(() => mailProviderUrl(email), [email]);
  const isVerified = verified || session?.user?.emailVerified;

  useEffect(() => {
    if (linkError) {
      setError(decodeURIComponent(linkError));
    }
  }, [linkError]);

  useEffect(() => {
    if (verified) {
      void update();
      setMessage("Your email is verified. Taking you into Parenfy…");
    }
  }, [verified, update]);

  useEffect(() => {
    if (!verified || status === "loading") return;
    const timer = window.setTimeout(() => {
      router.replace("/onboarding");
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [verified, status, router]);

  async function resend() {
    setSending(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        sent?: boolean;
        devVerifyUrl?: string;
        alreadyVerified?: boolean;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      if (data.alreadyVerified) {
        setMessage("Your email is already verified.");
        await update();
        return;
      }
      if (data.devVerifyUrl) {
        setMessage(`Dev mode: open verification link — ${data.devVerifyUrl}`);
        return;
      }
      setMessage("Verification email sent. Check your inbox (and spam).");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend email");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            {isVerified
              ? "You're all set — welcome to Parenfy."
              : "One quick step before Today's Plan unlocks."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {email ? (
            <p className="text-center">
              {isVerified ? "Verified:" : "We sent a link to"}{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          ) : status === "unauthenticated" ? (
            <p className="text-center">
              Sign in first to resend, or open the verification link from your inbox.
            </p>
          ) : null}

          {!isVerified && (
            <ol className="space-y-2 text-left list-decimal pl-5">
              <li>Open your inbox and tap <strong className="text-foreground">Verify email</strong>.</li>
              <li>Check spam if it&apos;s not there within a minute.</li>
              <li>Links expire in 24 hours — use resend below if needed.</li>
            </ol>
          )}

          {message ? <p className="text-green-600 dark:text-green-400 text-center">{message}</p> : null}
          {error ? <p className="text-destructive text-center">{error}</p> : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {isVerified ? (
            <Button asChild className="w-full">
              <Link href="/onboarding">Continue to setup</Link>
            </Button>
          ) : (
            <>
              {openMailUrl && (
                <Button asChild className="w-full">
                  <a href={openMailUrl} target="_blank" rel="noopener noreferrer">
                    <Mail className="h-4 w-4 mr-2" />
                    Open email app
                  </a>
                </Button>
              )}
              <Button
                className="w-full"
                variant={openMailUrl ? "outline" : "default"}
                onClick={resend}
                disabled={sending || status !== "authenticated"}
              >
                {sending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend verification email
                  </>
                )}
              </Button>
              {status !== "authenticated" && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/signin">Sign in to resend</Link>
                </Button>
              )}
            </>
          )}
          <Button asChild variant="ghost" className="w-full text-muted-foreground">
            <Link href="/auth/signin">Back to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
