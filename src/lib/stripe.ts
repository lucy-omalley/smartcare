import "server-only";

import Stripe from "stripe";
import type { SubscriptionPlan } from "@prisma/client";

let stripeClient: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (stripeClient !== undefined) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    stripeClient = null;
    return null;
  }
  stripeClient = new Stripe(key);
  return stripeClient;
}

export function getPriceId(plan: "PREMIUM" | "FAMILY"): string | null {
  if (plan === "PREMIUM") return process.env.STRIPE_PREMIUM_PRICE_ID ?? null;
  return process.env.STRIPE_FAMILY_PRICE_ID ?? null;
}

export function planFromPriceId(priceId: string): SubscriptionPlan | null {
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return "PREMIUM";
  if (priceId === process.env.STRIPE_FAMILY_PRICE_ID) return "FAMILY";
  return null;
}

export function getAppUrl(): string {
  return process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://parenfy.com";
}
