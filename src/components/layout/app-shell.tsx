import { BottomNav } from "@/components/nav/bottom-nav";
import { BetaFeedbackButton } from "@/components/feedback/beta-feedback-button";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20 magazine-bg">
      {children}
      <BottomNav />
      <BetaFeedbackButton />
    </div>
  );
}
