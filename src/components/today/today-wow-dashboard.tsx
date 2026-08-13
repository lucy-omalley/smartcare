"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DailyBriefContent } from "@/types/daily-brief";
import {
  Target,
  Lightbulb,
  BookOpen,
  UtensilsCrossed,
  Brain,
  Trophy,
  Heart,
  GraduationCap,
  BarChart3,
} from "lucide-react";

type Props = {
  brief: DailyBriefContent;
  childName?: string | null;
  onDismiss?: () => void;
};

export function TodayWowDashboard({ brief, childName, onDismiss }: Props) {
  const learningGoal =
    brief.todayFocus?.title ??
    brief.development[0]?.tryToday ??
    "Build confidence through playful learning";
  const developmentFocus = brief.weeklyFocus?.title ?? brief.development[0]?.domain ?? "Development";
  const achievementGoal =
    brief.milestone?.milestone ??
    `Celebrate one small win with ${childName ?? "your child"} today`;
  const motivational = brief.encouragement;

  const tiles = [
    {
      icon: Target,
      title: "Today's Learning Goal",
      body: learningGoal,
      detail: brief.todayFocus?.reason,
    },
    {
      icon: Lightbulb,
      title: "Today's Parent Tip",
      body: brief.parentTip?.content ?? brief.tip.content,
      detail: brief.parentTip?.reason,
    },
    {
      icon: BookOpen,
      title: "Recommended Story",
      body: brief.bedtimeStory.title,
      detail: brief.bedtimeStory.theme ?? brief.bedtimeStory.moral,
    },
    {
      icon: UtensilsCrossed,
      title: "Meal Suggestion",
      body: brief.recipe.title,
      detail: brief.recipe.subtitle,
    },
    {
      icon: Brain,
      title: "Development Focus",
      body: developmentFocus,
      detail: brief.weeklyFocus?.reason,
    },
    {
      icon: Trophy,
      title: "Small Achievement Goal",
      body: achievementGoal,
    },
    {
      icon: Heart,
      title: "Motivational Message",
      body: motivational,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Your parenting dashboard</h2>
          <p className="text-xs text-muted-foreground">
            Structured guidance for today — not a blank chat box.
          </p>
        </div>
        {onDismiss ? (
          <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={onDismiss}>
            Got it
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {tiles.map(({ icon: Icon, title, body, detail }) => (
          <Card key={title} className="rounded-xl border-primary/10">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-primary">
                <Icon className="h-3.5 w-3.5" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-sm font-medium leading-snug">{body}</p>
              {detail ? (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{detail}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline" className="rounded-xl">
          <Link href="/learning-plan">
            <GraduationCap className="h-4 w-4 mr-1" />
            Learning Plan
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="rounded-xl">
          <Link href="/weekly-report">
            <BarChart3 className="h-4 w-4 mr-1" />
            Weekly Report
          </Link>
        </Button>
      </div>
    </div>
  );
}
