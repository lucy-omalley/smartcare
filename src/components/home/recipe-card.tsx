'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Bookmark, ShoppingCart, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import type { DailyBriefRecipe } from '@/types/daily-brief';
import { VisualCardHero } from '@/components/visual/visual-card-hero';
import { toast } from 'sonner';

interface RecipeCardProps {
  recipe: DailyBriefRecipe;
  onRegenerate: () => Promise<void>;
  onSave: () => Promise<void>;
  loading?: boolean;
  imagesLoading?: boolean;
}

export function RecipeCard({ recipe, onRegenerate, onSave, loading, imagesLoading }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: 'regenerate' | 'save' | 'shopping', fn?: () => Promise<void>) => {
    setActionLoading(action);
    try {
      if (action === 'shopping') {
        await navigator.clipboard.writeText(`Shopping list — ${recipe.subtitle}\n\n${recipe.ingredients.join('\n')}`);
        toast.success('Shopping list copied!');
      } else if (fn) {
        await fn();
        toast.success(action === 'save' ? 'Recipe saved!' : 'New recipe generated!');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <article className="visual-card animate-fade-in-up">
      <VisualCardHero
        imageData={recipe.imageData}
        gradientKey="recipe"
        emoji="🍳"
        alt={recipe.subtitle}
        loading={imagesLoading}
      />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🍳</span>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Today&apos;s Recipe</p>
        </div>
        <div>
          <h2 className="text-xl font-bold leading-tight">{recipe.subtitle}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className="rounded-full bg-amber-100 text-amber-900 hover:bg-amber-100 border-0">
              {recipe.prepTimeMinutes} min
            </Badge>
            {recipe.difficulty && (
              <Badge variant="secondary" className="rounded-full">{recipe.difficulty}</Badge>
            )}
          </div>
        </div>
        {recipe.nutritionalHighlights && recipe.nutritionalHighlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.nutritionalHighlights.map((h) => (
              <Badge key={h} variant="outline" className="rounded-full text-xs font-normal border-emerald-200 text-emerald-800 bg-emerald-50">
                {h}
              </Badge>
            ))}
          </div>
        )}
        {recipe.healthyTip && (
          <p className="text-sm text-emerald-800/80 bg-emerald-50 rounded-2xl px-4 py-2.5 leading-relaxed">
            💚 {recipe.healthyTip}
          </p>
        )}
        <p className="text-sm text-muted-foreground leading-relaxed">{recipe.whyThisMeal}</p>
        <Button variant="ghost" size="sm" className="w-full rounded-full" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {expanded ? 'Hide recipe' : 'View recipe'}
        </Button>
        {expanded && (
          <div className="space-y-3 text-sm bg-muted/40 rounded-2xl p-4">
            <ul className="space-y-1 text-muted-foreground">
              {recipe.ingredients.map((item) => (
                <li key={item} className="flex gap-2"><span>•</span>{item}</li>
              ))}
            </ul>
            <ol className="space-y-2 text-muted-foreground">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-2"><span className="font-medium text-foreground">{i + 1}.</span>{step}</li>
              ))}
            </ol>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <Button size="sm" variant="outline" className="rounded-full touch-target" disabled={!!loading || actionLoading === 'save'} onClick={() => handleAction('save', onSave)}>
            <Bookmark className="h-3.5 w-3.5 mr-1" />Save
          </Button>
          <Button size="sm" variant="outline" className="rounded-full touch-target" disabled={!!loading || actionLoading === 'regenerate'} onClick={() => handleAction('regenerate', onRegenerate)}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${actionLoading === 'regenerate' ? 'animate-spin' : ''}`} />New
          </Button>
          <Button size="sm" variant="outline" className="rounded-full touch-target" onClick={() => handleAction('shopping')}>
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />List
          </Button>
        </div>
      </div>
    </article>
  );
}
