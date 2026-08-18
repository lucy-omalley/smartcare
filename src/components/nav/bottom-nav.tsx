"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, MessageCircle, Users, User, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

const navItems = [
  { href: "/today", labelKey: "nav.today", icon: Sun },
  { href: "/mumbot", labelKey: "nav.mumbot", icon: MessageCircle },
  { href: "/connect", labelKey: "nav.connect", icon: Users },
  { href: "/profile", labelKey: "nav.profile", icon: User },
  { href: "/more", labelKey: "nav.more", icon: MoreHorizontal },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-safe">
      <div className="container flex h-16 items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const isActive =
            pathname === href ||
            pathname.startsWith(href + "/") ||
            (href === "/today" && pathname === "/home");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors min-w-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
