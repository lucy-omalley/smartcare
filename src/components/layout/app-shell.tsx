import { BottomNav } from "@/components/nav/bottom-nav";
import { AppLanguageBar } from "@/components/i18n/app-language-bar";
import { BetaFeedbackButton } from "@/components/feedback/beta-feedback-button";
import { PublicBetaBanner } from "@/components/beta/public-beta-banner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20 magazine-bg">
      <AppLanguageBar />
      <PublicBetaBanner />
      {children}
      <BottomNav />
      <BetaFeedbackButton />
    </div>
  );
}
