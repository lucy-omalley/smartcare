import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";

const COMPARISONS = [
  {
    topic: "Remembers your child",
    chatgpt: "Starts fresh every chat",
    parenfy: "Child profile, age, interests, and goals persist",
  },
  {
    topic: "Daily structure",
    chatgpt: "You decide what to ask",
    parenfy: "Today's Plan tells you what to do today",
  },
  {
    topic: "Development tracking",
    chatgpt: "No timeline or progress view",
    parenfy: "Weekly growth reports and milestones",
  },
  {
    topic: "Learning journey",
    chatgpt: "Unstructured answers",
    parenfy: "Personalized learning plans with activities",
  },
  {
    topic: "Parenting tools",
    chatgpt: "Generic assistant",
    parenfy: "Meals, stories, activities, language — in one OS",
  },
  {
    topic: "Community",
    chatgpt: "Not built for parents nearby",
    parenfy: "Connect with parents in your area (beta)",
  },
  {
    topic: "Future: Parent voice",
    chatgpt: "No voice continuity",
    parenfy: "Bedtime stories designed for your voice (coming)",
  },
];

export default function WhyParenfyPage() {
  return (
    <AppShell>
      <div className="container max-w-lg mx-auto p-4 space-y-6 pb-12">
        <div className="pt-2 space-y-2">
          <h1 className="text-2xl font-bold">Why Parenfy?</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ChatGPT is a brilliant general assistant. Parenfy is an{" "}
            <span className="font-medium text-foreground">AI Parenting Operating System</span> — built
            around your child, your goals, and what you should do today.
          </p>
        </div>

        <Card className="rounded-2xl bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-sm">
            <p className="font-medium">Every page answers:</p>
            <p className="text-primary font-semibold mt-1">&ldquo;What should I do today?&rdquo;</p>
            <p className="text-muted-foreground mt-2 text-xs">Not &ldquo;What do you want to ask?&rdquo;</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {COMPARISONS.map((row) => (
            <Card key={row.topic} className="rounded-2xl overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">{row.topic}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 grid gap-2 text-xs">
                <div className="flex gap-2 items-start text-muted-foreground">
                  <X className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">ChatGPT: </span>
                    {row.chatgpt}
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <div>
                    <span className="font-medium">Parenfy: </span>
                    {row.parenfy}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild className="rounded-xl w-full">
            <Link href="/today">Open Today&apos;s Plan</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl w-full">
            <Link href="/auth/register">Join the beta</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
