'use client';

import {
  Bot,
  Heart,
  MessageCircle,
  Users,
  Brain,
  ArrowRight,
  Sparkles,
  BookOpen,
  UtensilsCrossed,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeNav } from "@/components/nav/home-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

const pillars = [
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: "MumBot AI support",
    description: "Warm, practical parenting guidance whenever you need a co-pilot.",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Personalised Today Plan",
    description: "Daily meals, activities, stories, and language ideas tailored to your child.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Safe parent connection",
    description: "Broad-area availability and events — no exact addresses shown publicly.",
  },
  {
    icon: <Brain className="h-6 w-6" />,
    title: "Family memory",
    description: "Save milestones and preferences you control — edit or delete anytime.",
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Built with parents",
    description: "Public Beta means your feedback directly shapes what we build next.",
  },
];

const tryToday = [
  { icon: Sparkles, label: "Today dashboard with daily plan" },
  { icon: MessageCircle, label: "MumBot chat for parenting questions" },
  { icon: UtensilsCrossed, label: "Meal ideas & fridge-to-recipe" },
  { icon: BookOpen, label: "Bedtime stories with listen mode" },
  { icon: Users, label: "Connect with nearby parents safely" },
];

const improving = [
  "Apple Sign In",
  "Password reset self-service",
  "Connect area filtering",
  "Report & block moderation tools",
];

const betaExpectations = [
  "Some features may change as we learn from parents",
  "AI responses improve over time with your feedback",
  "We welcome honest feedback — tap Feedback in the app",
  "Parenfy supports everyday parenting — not emergencies or professional diagnosis",
];

export default function Home() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0];

  useEffect(() => {
    trackEvent("landing_page_viewed");
  }, []);

  const handleBetaCta = (location: string) => {
    trackEvent("beta_cta_clicked", { location });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <HomeNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative w-full py-12 md:py-20 lg:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background -z-10" />
          <div className="container px-4 md:px-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-4">
                <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  Public Beta — Now open
                </div>
                {session && firstName ? (
                  <>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                      Welcome back, {firstName} 👋
                    </h1>
                    <p className="text-lg text-muted-foreground md:text-xl leading-relaxed max-w-xl mx-auto">
                      Your Today plan, MumBot, and Connect are ready. Thanks for helping shape Parenfy during Public Beta.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                      Parenfy is now in Public Beta
                    </h1>
                    <p className="text-lg text-muted-foreground md:text-xl leading-relaxed max-w-xl mx-auto">
                      Join early parents shaping an AI parenting companion for daily guidance, activities, stories,
                      meals, and safe parent connection.
                    </p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Parenfy is still improving. Your feedback helps shape the product.
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                {session ? (
                  <>
                    <Link href="/today" onClick={() => handleBetaCta("hero_today")}>
                      <Button size="lg" className="rounded-xl w-full sm:w-auto group">
                        Go to Today
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    <Link href="/mumbot" onClick={() => handleBetaCta("hero_mumbot")}>
                      <Button variant="outline" size="lg" className="rounded-xl w-full sm:w-auto">
                        Chat with MumBot
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/register" onClick={() => handleBetaCta("hero_register")}>
                      <Button size="lg" className="rounded-xl w-full sm:w-auto group">
                        Join the Public Beta
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    <Link href="/auth/signin" onClick={() => handleBetaCta("hero_signin")}>
                      <Button variant="outline" size="lg" className="rounded-xl w-full sm:w-auto">
                        Sign in
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* What is Parenfy */}
        <section id="features" className="w-full py-12 md:py-20 bg-gradient-to-b from-background to-muted/30">
          <div className="container px-4 md:px-6 max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight">What is Parenfy?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Parenfy is your AI parenting companion — personalised daily plans, MumBot support, child development
                activities, stories, meals, language practice, and parent connection. Now in Public Beta.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pillars.map((pillar) => (
                <Card key={pillar.title} className="rounded-2xl border-primary/10 hover:border-primary/20 hover:shadow-md transition-all">
                  <CardHeader>
                    <div className="mb-2 p-2 w-fit rounded-xl bg-primary/10 text-primary">{pillar.icon}</div>
                    <CardTitle className="text-lg">{pillar.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Who + try today */}
        <section className="w-full py-12 md:py-20">
          <div className="container px-4 md:px-6 max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">Who is it for?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Parents and carers of babies through early school age who want calm, personalised daily guidance —
                without another overwhelming parenting app.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">What you can try today</h2>
              <ul className="space-y-3">
                {tryToday.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Beta expectations */}
        <section className="w-full py-12 md:py-20 bg-muted/30">
          <div className="container px-4 md:px-6 max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Beta expectations</h2>
              <p className="text-muted-foreground">What to know before you join</p>
            </div>
            <ul className="space-y-3">
              {betaExpectations.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-2xl border p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Still improving</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1.5 pl-7 list-disc">
                {improving.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* How feedback helps */}
        <section className="w-full py-12 md:py-16">
          <div className="container px-4 md:px-6 max-w-2xl mx-auto text-center space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">How feedback helps</h2>
            <p className="text-muted-foreground leading-relaxed">
              Every rating and note goes to our team. Public Beta parents directly influence what we fix, polish, and
              build next. Tap <strong className="text-foreground">Feedback</strong> anywhere in the app.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
          <div className="container px-4 md:px-6 text-center space-y-6 max-w-xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Join the Parenfy Public Beta</h2>
            <p className="text-primary-foreground/90 leading-relaxed">
              Parenfy is in Public Beta. We are building it with parents.
            </p>
            <Link
              href={session ? "/today" : "/auth/register"}
              onClick={() => handleBetaCta("footer_cta")}
            >
              <Button size="lg" variant="secondary" className="rounded-xl bg-white hover:bg-white/90 text-primary">
                {session ? "Go to Today" : "Join the Public Beta"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
