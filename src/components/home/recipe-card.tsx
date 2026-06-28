'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChefHat, RefreshCw, Bookmark, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import type { DailyBriefRecipe } from '@/types/daily-brief';
import { toast } from 'sonner';

interface RecipeCardProps {
  recipe: DailyBriefRecipe;
  onRegenerate: () => Promise<void>;
  onSave: () => Promise<void>;
  loading?: boolean;
}

export function RecipeCard({ recipe, onRegenerate, onSave, loading }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: 'regenerate' | 'save' | 'shopping', fn?: () => Promise<void>) => {
    setActionLoading(action);
    try {
      if (action === 'shopping') {
        const list = recipe.ingredients.join('\n');
        await navigator.clipboard.writeText(`Shopping list — ${recipe.subtitle}\n\n${list}`);
        toast.success('Shopping list copied!');
      } else if (fn) {
        await fn();
        toast.success(action === 'save' ? 'Recipe saved!' : 'New recipe generated!');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card className="rounded-2xl border-orange-200/50 bg-gradient-to-br from-orange-50/80 to-background dark:from-orange-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <ChefHat className="h-4 w-4 text-orange-600" />
          <CardTitle className="text-base">Today&apos;s Meal</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{recipe.title}</p>
          <p className="font-semibold text-lg leading-tight mt-0.5">{recipe.subtitle}</p>
          <Badge variant="secondary" className="mt-2 rounded-full text-xs">
            {recipe.prepTimeMinutes} min prep
          </Badge>
        </div>
        <div className="bg-background/60 rounded-xl p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Why this meal?</p>
          <p className="text-sm leading-relaxed">{recipe.whyThisMeal}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {expanded ? 'Hide recipe' : 'View recipe'}
        </Button>
        {expanded && (
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">Ingredients</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                {recipe.ingredients.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Steps</p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                {recipe.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl flex-1 min-w-[100px]"
            disabled={!!loading || actionLoading === 'save'}
            onClick={() => handleAction('save', onSave)}
          >
            <Bookmark className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl flex-1 min-w-[100px]"
            disabled={!!loading || actionLoading === 'regenerate'}
            onClick={() => handleAction('regenerate', onRegenerate)}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${actionLoading === 'regenerate' ? 'animate-spin' : ''}`} />
            Another
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl flex-1 min-w-[100px]"
            onClick={() => handleAction('shopping')}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            List
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
