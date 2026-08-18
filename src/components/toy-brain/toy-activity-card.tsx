"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Heart, MapPin, Printer, Sparkles, Lock } from "lucide-react";
import type { ToyPlayActivity } from "@/types/toy-brain";
import { useTranslation } from "@/hooks/use-translation";
import { localizedSkillLabel } from "@/lib/i18n/skill-labels";
import { cn } from "@/lib/utils";

interface ToyActivityCardProps {
  activity: ToyPlayActivity;
  isFavourite?: boolean;
  isPremium?: boolean;
  onFavourite?: () => void;
  onAddToToday?: () => void;
  onPrint?: () => void;
  addingToToday?: boolean;
}

export function ToyActivityCard({
  activity,
  isFavourite,
  isPremium,
  onFavourite,
  onAddToToday,
  onPrint,
  addingToToday,
}: ToyActivityCardProps) {
  const { locale } = useTranslation();
  return (
    <Card className="rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-6 text-center">
        <span className="text-6xl" role="img" aria-hidden>
          {activity.heroEmoji}
        </span>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-base">{activity.title}</h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="secondary" className="rounded-full text-[10px]">
              <Clock className="h-3 w-3 mr-1" />
              {activity.durationMinutes} min
            </Badge>
            <Badge variant="outline" className="rounded-full text-[10px] capitalize">
              {activity.difficulty}
            </Badge>
            <Badge variant="outline" className="rounded-full text-[10px] capitalize">
              <MapPin className="h-3 w-3 mr-1" />
              {activity.indoorOutdoor}
            </Badge>
            {activity.messLevel === "mess_free" && (
              <Badge variant="outline" className="rounded-full text-[10px]">
                ✨ Mess free
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {activity.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} className="rounded-full text-[10px]" variant="secondary">
              {localizedSkillLabel(skill, locale)}
            </Badge>
          ))}
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Mission</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            {activity.instructions.slice(0, 4).map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        {activity.learningOutcomes.length > 0 && (
          <div className="rounded-xl bg-muted/50 p-3 text-xs space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Why this helps
            </p>
            {activity.learningOutcomes.map((o, i) => (
              <p key={i} className="text-muted-foreground">{o}</p>
            ))}
          </div>
        )}

        {activity.parentTips[0] && (
          <p className="text-xs text-muted-foreground italic">💡 {activity.parentTips[0]}</p>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          {onFavourite && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("rounded-xl", isFavourite && "border-primary text-primary")}
              onClick={onFavourite}
            >
              <Heart className={cn("h-3.5 w-3.5 mr-1", isFavourite && "fill-current")} />
              Favourite
            </Button>
          )}
          {onPrint && (
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={onPrint}>
              <Printer className="h-3.5 w-3.5 mr-1" /> Print
            </Button>
          )}
        </div>

        {onAddToToday && (
          <Button
            type="button"
            className="rounded-xl w-full"
            size="sm"
            disabled={addingToToday}
            onClick={onAddToToday}
          >
            {!isPremium && <Lock className="h-3.5 w-3.5 mr-1" />}
            {addingToToday ? "Adding…" : "Add to Today's Plan"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
