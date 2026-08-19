"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useTranslation } from "@/hooks/use-translation";
import { useLandingNavLabels } from "@/lib/i18n/landing-nav";
import { cn } from "@/lib/utils";

export function LandingNavV2() {
  const { t } = useTranslation();
  const navItems = useLandingNavLabels();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <nav className="container flex h-16 md:h-[4.25rem] items-center gap-4 px-4 md:px-6">
        <Link href="/#top" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <span className="font-semibold text-lg tracking-tight">Parenfy</span>
        </Link>
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl hover:bg-muted/60 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Link href="/auth/signin" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="rounded-xl">
              {t("nav.signIn")}
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm" className="rounded-xl shadow-sm">
              {t("nav.startFree")}
            </Button>
          </Link>
          <ThemeSelector />
        </div>
      </nav>

      {/* Mobile / tablet anchor nav — fixes broken submenu on smaller screens */}
      <div className="lg:hidden border-t border-border/40 bg-background/90">
        <div className="container px-4 py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex gap-1.5 min-w-max">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 text-xs font-medium px-3.5 py-2 rounded-full",
                  "border border-border/60 bg-muted/30 text-muted-foreground",
                  "hover:text-foreground hover:bg-muted/60 transition-colors"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
