"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderRegistrationForm } from "@/components/forms/provider-registration-form";

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <main className="min-h-screen py-20">
      <div className="container max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Register as a Provider</CardTitle>
            <CardDescription>
              Join our network of trusted childcare providers and start connecting with families in need.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProviderRegistrationForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 