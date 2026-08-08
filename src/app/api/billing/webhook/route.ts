import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, planFromPriceId } from "@/lib/stripe";

export const dynamic = "force-dynamic";

async function syncSubscription(subscription: Stripe.Subscription, userId: string) {
  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? planFromPriceId(priceId) : null;
  const active = subscription.status === "active" || subscription.status === "trialing";

  const periodEnd =
    "current_period_end" in subscription && typeof subscription.current_period_end === "number"
      ? subscription.current_period_end
      : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status.toUpperCase() as
        | "ACTIVE"
        | "PAST_DUE"
        | "CANCELED"
        | "TRIALING"
        | "INCOMPLETE",
      subscriptionPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      planTier: active && plan ? plan : "FREE",
    },
  });
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription && typeof session.subscription === "string") {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        await syncSubscription(sub, userId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      let resolvedUserId: string | undefined = userId;
      if (!resolvedUserId) {
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
          select: { id: true },
        });
        resolvedUserId = user?.id;
      }
      if (resolvedUserId) {
        if (event.type === "customer.subscription.deleted") {
          await prisma.user.update({
            where: { id: resolvedUserId },
            data: {
              planTier: "FREE",
              subscriptionStatus: "CANCELED",
              stripeSubscriptionId: null,
            },
          });
        } else {
          await syncSubscription(subscription, resolvedUserId);
        }
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
