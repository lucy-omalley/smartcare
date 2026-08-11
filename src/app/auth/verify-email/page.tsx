"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerifyEmailPage() {
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const verified = searchParams.get("verified") === "1";
  const linkError = searchParams.get("error");

  useEffect(() => {
    if (linkError) {
      setError(decodeURIComponent(linkError));
    }
  }, [linkError]);

  useEffect(() => {
    if (verified) {
      void update();
      setMessage("Your email is verified. You can open the app now.");
    }
  }, [verified, update]);

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
      setMessage("Verification email sent. Check your inbox.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend email");
    } finally {
      setSending(false);
    }
  }

  const email = session?.user?.email;

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify your email</CardTitle>
          <CardDescription className="text-center">
            {verified
              ? "You're all set."
              : "We sent a link to your inbox. Verify your email to use Parenfy."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground text-center">
          {email ? <p>Signed in as <span className="font-medium text-foreground">{email}</span></p> : null}
          {!verified && (
            <p>
              Check spam if you don&apos;t see it. Links expire in 24 hours.
            </p>
          )}
          {message ? <p className="text-green-600 dark:text-green-400">{message}</p> : null}
          {error ? <p className="text-destructive">{error}</p> : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {verified || session?.user?.emailVerified ? (
            <Button asChild className="w-full">
              <Link href="/today">Go to Today&apos;s Plan</Link>
            </Button>
          ) : (
            <Button className="w-full" onClick={resend} disabled={sending || status !== "authenticated"}>
              {sending ? "Sending…" : "Resend verification email"}
            </Button>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/signin">Back to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
