'use client';

import { Bot, Heart, MessageCircle, Users, Brain, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeNav } from "@/components/nav/home-nav";
import Link from 'next/link';
import { useSession } from "next-auth/react";

const pillars = [
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: "AI Co-Parent",
    description: "MumBot is your encouraging AI parenting companion — practical advice, warm support, whenever you need it."
  },
  {
    icon: <Brain className="h-6 w-6" />,
    title: "Family Memory",
    description: "Save what matters about your family. You control every memory — edit, delete, or keep private."
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Parent Community",
    description: "A safe, positive space for questions, recommendations, and coffee walks with nearby parents."
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "Local Activities",
    description: "Discover library events, playgroups, museum activities, and weekend family fun near you."
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Trust First",
    description: "Privacy is our advantage. Minimal onboarding, transparent memory, and you always control your data."
  },
];

export default function Home() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0];

  return (
    <div className="flex min-h-screen flex-col">
      <HomeNav />
      <main className="flex-1">
        <section className="relative w-full py-12 md:py-24 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background -z-10" />
          <div className="container px-4 md:px-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-4">
                <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  SmartCare — Every parent deserves a village
                </div>
                {session && firstName ? (
                  <>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                      Hi {firstName} 👋
                    </h1>
                    <p className="text-lg text-muted-foreground md:text-xl leading-relaxed max-w-xl mx-auto">
                      I&apos;m <strong>MumBot</strong>. I&apos;m here whenever you need parenting advice,
                      activity ideas, or simply someone to think things through with.
                    </p>
                    <p className="text-muted-foreground">Let&apos;s raise happy children together.</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                      Meet MumBot — Your AI Co-Parent
                    </h1>
                    <p className="text-lg text-muted-foreground md:text-xl leading-relaxed max-w-xl mx-auto">
                      Helping parents raise happier children through personalised AI guidance,
                      trusted family memories, and meaningful community connections.
                    </p>
                  </>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                {session ? (
                  <>
                    <Link href="/home">
                      <Button size="lg" className="rounded-xl group">
                        Start Chatting
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    <Link href="/community">
                      <Button variant="outline" size="lg" className="rounded-xl">
                        Explore Community
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/signin">
                      <Button size="lg" className="rounded-xl group">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button variant="outline" size="lg" className="rounded-xl">
                        Create Account
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="container px-4 md:px-6 max-w-5xl mx-auto">
            <div className="text-center space-y-2 mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Built for parents, not trackers</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                SmartCare is AI-first. Everything supports your ongoing conversation with someone who genuinely understands your family.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pillars.map((pillar, index) => (
                <Card key={index} className="rounded-2xl border-primary/10 hover:border-primary/20 hover:shadow-md transition-all">
                  <CardHeader>
                    <div className="mb-2 p-2 w-fit rounded-xl bg-primary/10 text-primary">
                      {pillar.icon}
                    </div>
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

        <section className="w-full py-12 md:py-24 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
          <div className="container px-4 md:px-6 text-center space-y-6 max-w-xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">
              Your village starts here
            </h2>
            <p className="text-primary-foreground/90">
              Join parents who chat with MumBot, save family memories, and connect with their community.
            </p>
            <Link href={session ? "/home" : "/auth/signin"}>
              <Button size="lg" variant="secondary" className="rounded-xl bg-white hover:bg-white/90 text-primary">
                {session ? "Go to Home" : "Start Free"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
