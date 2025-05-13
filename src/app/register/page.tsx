"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProviderRegistrationForm } from "@/components/forms/provider-registration-form";

export default function RegisterPage() {
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