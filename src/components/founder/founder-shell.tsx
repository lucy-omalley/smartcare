"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Filter,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  FlaskConical,
  DollarSign,
  MessageSquare,
  BookOpen,
  LayoutGrid,
  Printer,
  Brain,
  BarChart3,
  PlayCircle,
} from "lucide-react";

const NAV = [
  { href: "/admin/founder", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/founder/growth", label: "Growth", icon: BarChart3 },
  { href: "/admin/founder/journey", label: "Journey", icon: PlayCircle },
  { href: "/admin/founder/users", label: "Users", icon: Users },
  { href: "/admin/founder/funnel", label: "Funnel", icon: Filter },
  { href: "/admin/founder/storytime", label: "Storytime", icon: BookOpen },
  { href: "/admin/founder/routines", label: "Routines", icon: LayoutGrid },
  { href: "/admin/founder/posters", label: "Adventure Journey", icon: Printer },
  { href: "/admin/founder/toy-brain", label: "Toy Brain", icon: Brain },
  { href: "/admin/founder/retention", label: "Retention", icon: TrendingUp },
  { href: "/admin/founder/ai", label: "AI", icon: Sparkles },
  { href: "/admin/founder/errors", label: "Errors", icon: AlertTriangle },
  { href: "/admin/founder/beta", label: "Beta", icon: FlaskConical },
  { href: "/admin/costs", label: "Costs", icon: DollarSign },
];

export function FounderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 sticky top-0 z-40 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold">Founder Control Centre</h1>
            <p className="text-xs text-muted-foreground">Growth intelligence & user analytics</p>
          </div>
          <nav className="flex flex-wrap gap-1">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="container max-w-6xl mx-auto px-4 py-6 pb-12">{children}</main>
    </div>
  );
}
