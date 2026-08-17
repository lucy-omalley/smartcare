"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Bot, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HomeNav } from "@/components/nav/home-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  DAILY_JOURNEY,
  FEATURE_COMPARISON,
  HERO_EXPERIENCES,
  HOW_IT_WORKS,
  LANDING_FAQ,
  PRICING_TIERS,
  TESTIMONIALS,
} from "@/lib/landing/content";

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div id={id} className="text-center space-y-3 max-w-2xl mx-auto scroll-mt-24">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
      )}
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {description && <p className="text-muted-foreground leading-relaxed">{description}</p>}
    </div>
  );
}

export function LandingPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0];

  const primaryHref = session ? "/today" : "/auth/register";
  const primaryLabel = session ? "Go to Today" : "Join the Public Beta";

  const trackCta = (location: string) => {
    trackEvent("beta_cta_clicked", { location });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <HomeNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative w-full py-16 md:py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-background -z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent -z-10" />
          <div className="container px-4 md:px-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Bot className="h-4 w-4" />
                Public Beta — AI parenting OS
              </div>
              {session && firstName ? (
                <>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-3xl">
                    Welcome back, {firstName}
                  </h1>
                  <p className="text-lg text-muted-foreground md:text-xl max-w-2xl leading-relaxed">
                    Your Today plan, family voice stories, and MumBot are ready. Thanks for shaping Parenfy with us.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-3xl">
                    Know what to do today — and hear bedtime in{" "}
                    <span className="text-primary">your voice</span>
                  </h1>
                  <p className="text-lg text-muted-foreground md:text-xl max-w-2xl leading-relaxed">
                    Parenfy is your AI parenting companion: personalised daily plans, warm MumBot support,
                    and Family Voice Storytime for calm evenings.
                  </p>
                </>
              )}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link href={primaryHref} onClick={() => trackCta("hero_primary")}>
                  <Button size="lg" className="rounded-xl w-full sm:w-auto group h-12 px-8">
                    {primaryLabel}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="#how-it-works" onClick={() => trackCta("hero_learn")}>
                  <Button variant="outline" size="lg" className="rounded-xl w-full sm:w-auto h-12 px-8">
                    See how it works
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full py-16 md:py-24 bg-muted/30">
          <div className="container px-4 md:px-6 max-w-5xl mx-auto space-y-12">
            <SectionHeading
              id="how-it-works"
              eyebrow="How it works"
              title="Three steps to calmer days"
              description="Less scrolling. More doing. Parenfy turns your child's profile into daily action."
            />
            <div className="grid gap-6 md:grid-cols-3">
              {HOW_IT_WORKS.map((item) => (
                <Card key={item.step} className="rounded-2xl border-primary/10 relative overflow-hidden">
                  <div className="absolute top-4 right-4 text-5xl font-bold text-primary/10 select-none">
                    {item.step}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg pr-12">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 3 Hero Experiences */}
        <section className="w-full py-16 md:py-24">
          <div className="container px-4 md:px-6 max-w-5xl mx-auto space-y-12">
            <SectionHeading
              id="experiences"
              eyebrow="Hero experiences"
              title="Three reasons parents stay"
              description="Signature features that go beyond a chatbot — built for real family routines."
            />
            <div className="grid gap-6 md:grid-cols-3">
              {HERO_EXPERIENCES.map((exp) => {
                const Icon = exp.icon;
                return (
                  <Card
                    key={exp.title}
                    className="rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all flex flex-col"
                  >
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit">
                          <Icon className="h-6 w-6" />
                        </div>
                        {exp.badge && (
                          <Badge variant="secondary" className="rounded-full text-[10px]">
                            {exp.badge}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-primary uppercase tracking-wide">
                          {exp.tagline}
                        </p>
                        <CardTitle className="text-xl mt-1">{exp.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                        {exp.description}
                      </p>
                      <Link href={session ? exp.href : "/auth/register"}>
                        <Button variant="outline" className="rounded-xl w-full">
                          Explore
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Daily Journey Timeline */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background">
          <div className="container px-4 md:px-6 max-w-3xl mx-auto space-y-12">
            <SectionHeading
              id="journey"
              eyebrow="Daily journey"
              title="One app from morning to bedtime"
              description="Parenfy follows your day — not the other way around."
            />
            <div className="relative pl-10 space-y-8">
              <div className="absolute left-[1.125rem] top-2 bottom-2 w-px bg-border" />
              {DAILY_JOURNEY.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.time} className="relative">
                    <div className="absolute -left-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">{step.time}</p>
                    <h3 className="font-semibold text-lg mt-0.5">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1 max-w-lg">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="w-full py-16 md:py-24">
          <div className="container px-4 md:px-6 max-w-5xl mx-auto space-y-12">
            <SectionHeading
              id="testimonials"
              eyebrow="Testimonials"
              title="Built with beta parents"
              description="Early families helping us polish every release."
            />
            <div className="grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <Card key={t.name} className="rounded-2xl bg-primary/5 border-primary/10">
                  <CardContent className="p-6 space-y-4">
                    <p className="text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="w-full py-16 md:py-24 bg-muted/30">
          <div className="container px-4 md:px-6 max-w-4xl mx-auto space-y-12">
            <SectionHeading
              id="comparison"
              eyebrow="Why Parenfy"
              title="More than a chatbot"
              description="ChatGPT answers questions. Parenfy runs your parenting day."
            />
            <div className="overflow-hidden rounded-2xl border bg-background divide-y">
              <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_1fr] gap-px bg-border text-sm font-semibold">
                <div className="bg-muted/50 p-4">Feature</div>
                <div className="bg-muted/50 p-4 text-muted-foreground">Generic AI</div>
                <div className="bg-primary/5 p-4 text-primary">Parenfy</div>
              </div>
              {FEATURE_COMPARISON.map((row) => (
                <div key={row.topic} className="p-4 sm:grid sm:grid-cols-[1fr_1fr_1fr] sm:gap-4 sm:items-start space-y-3 sm:space-y-0">
                  <p className="font-medium sm:pt-0">{row.topic}</p>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{row.generic}</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    <span>{row.parenfy}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link href="/why-parenfy">
                <Button variant="link" className="text-primary">
                  Read full comparison
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="w-full py-16 md:py-24">
          <div className="container px-4 md:px-6 max-w-5xl mx-auto space-y-12">
            <SectionHeading
              id="pricing"
              eyebrow="Pricing"
              title="Start free. Upgrade when you're ready."
              description="Public Beta includes a generous free tier. Premium unlocks Family Voice Storytime."
            />
            <div className="grid gap-6 md:grid-cols-3">
              {PRICING_TIERS.map((tier) => (
                <Card
                  key={tier.id}
                  className={cn(
                    "rounded-2xl flex flex-col",
                    tier.highlighted && "border-primary shadow-lg ring-1 ring-primary/20 scale-[1.02]"
                  )}
                >
                  <CardHeader>
                    {tier.highlighted && (
                      <Badge className="w-fit rounded-full mb-2">Most popular</Badge>
                    )}
                    <CardTitle>{tier.name}</CardTitle>
                    <div className="pt-2">
                      <span className="text-3xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground text-sm ml-1">/{tier.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pt-2">{tier.description}</p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-6">
                    <ul className="space-y-2 text-sm flex-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={session && tier.id !== "free" ? "/billing" : tier.href}>
                      <Button
                        className="rounded-xl w-full"
                        variant={tier.highlighted ? "default" : "outline"}
                        onClick={() => trackCta(`pricing_${tier.id}`)}
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full py-16 md:py-24 bg-muted/30">
          <div className="container px-4 md:px-6 max-w-3xl mx-auto space-y-12">
            <SectionHeading
              id="faq"
              eyebrow="FAQ"
              title="Common questions"
              description="Quick answers before you join."
            />
            <div className="space-y-3">
              {LANDING_FAQ.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border bg-background px-5 py-4 open:shadow-sm"
                >
                  <summary className="font-medium cursor-pointer list-none flex justify-between items-center gap-4">
                    {item.question}
                    <span className="text-muted-foreground group-open:rotate-45 transition-transform text-xl leading-none">
                      +
                    </span>
                  </summary>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-3 pt-3 border-t">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              More answers in{" "}
              <Link href="/library/faq" className="text-primary underline underline-offset-2">
                Help & FAQ
              </Link>
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-br from-primary to-primary/85 text-primary-foreground">
          <div className="container px-4 md:px-6 text-center space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready for calmer days and warmer bedtimes?
            </h2>
            <p className="text-primary-foreground/90 text-lg leading-relaxed">
              Join parents shaping the AI parenting OS — free to start, Premium when you want your voice in the story.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href={primaryHref} onClick={() => trackCta("footer_cta")}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-xl bg-white hover:bg-white/90 text-primary h-12 px-8 w-full sm:w-auto"
                >
                  {primaryLabel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              {!session && (
                <Link href="/auth/signin" onClick={() => trackCta("footer_signin")}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-xl border-white/30 text-white hover:bg-white/10 h-12 px-8 w-full sm:w-auto"
                  >
                    Sign in
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
