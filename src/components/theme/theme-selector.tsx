'use client';

import { useAtom } from 'jotai';
import { Palette } from 'lucide-react';
import { themeAtom } from '@/lib/store/theme';
import { Theme, themeNames } from '@/lib/themes';
import { cn } from '@/lib/utils';

export function ThemeSelector() {
  const [currentTheme, setTheme] = useAtom(themeAtom);

  return (
    <div className="relative group">
      <button
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
        aria-label="Select theme"
      >
        <Palette className="h-4 w-4" />
      </button>
      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background border border-input opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1" role="menu">
          {Object.entries(themeNames).map(([theme, name]) => (
            <button
              key={theme}
              className={cn(
                "w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                currentTheme === theme && "bg-accent text-accent-foreground"
              )}
              onClick={() => setTheme(theme as Theme)}
              role="menuitem"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 