"use client";

import { PhoneFrame } from "@/components/landing/v2/ui/phone-frame";
import { LandingSection, SectionHeader } from "@/components/landing/v2/ui/section-shell";
import { cn } from "@/lib/utils";

function TodayMock() {
  return (
    <div className="pt-8 px-3 pb-3 h-full bg-gradient-to-b from-amber-50/80 to-background dark:from-amber-950/20">
      <p className="text-[10px] font-bold text-primary mb-2">Today</p>
      <div className="space-y-2">
        {["Morning activity", "Lunch idea", "Bedtime story"].map((l) => (
          <div key={l} className="rounded-xl bg-background border p-2.5 text-[9px] font-medium shadow-sm">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

function ToyMock() {
  return (
    <div className="pt-8 px-3 pb-3 h-full bg-gradient-to-b from-orange-50/80 to-background">
      <div className="rounded-xl bg-muted aspect-square flex items-center justify-center text-3xl mb-2">🧱</div>
      <p className="text-[9px] font-bold">LEGO Builder</p>
      <div className="mt-2 space-y-1">
        {["Bridge challenge", "Sort by colour"].map((a) => (
          <div key={a} className="text-[8px] rounded-lg bg-primary/10 px-2 py-1">{a}</div>
        ))}
      </div>
    </div>
  );
}

function AdventureMock() {
  return (
    <div className="pt-8 px-3 pb-3 h-full bg-gradient-to-b from-emerald-50/80 to-background">
      <div className="rounded-xl border-2 border-dashed border-emerald-300 p-2 text-center">
        <p className="text-lg">🦕</p>
        <p className="text-[8px] font-bold mt-1">Dino Bedtime Mission</p>
        <div className="mt-2 h-8 bg-muted rounded flex items-center justify-center text-[7px]">QR</div>
      </div>
    </div>
  );
}

function StoryMock() {
  return (
    <div className="pt-8 px-3 pb-3 h-full bg-gradient-to-b from-indigo-100/80 to-indigo-950/90 text-indigo-50">
      <p className="text-[9px] opacity-80">Bedtime mode</p>
      <p className="text-[10px] font-bold mt-2 leading-tight">The Moonlit Garden</p>
      <div className="mt-4 mx-auto w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
        <span className="text-lg">▶</span>
      </div>
      <p className="text-[8px] text-center mt-3 opacity-70">Mum&apos;s voice</p>
    </div>
  );
}

const MOCKS = {
  today: TodayMock,
  toy: ToyMock,
  adventure: AdventureMock,
  story: StoryMock,
} as const;

const ITEMS = [
  { id: "today" as const, title: "Today's Plan" },
  { id: "toy" as const, title: "Toy Brain" },
  { id: "adventure" as const, title: "Adventure Poster" },
  { id: "story" as const, title: "Family Voice Story" },
];

export function ScreenshotsSection() {
  return (
    <LandingSection id="screenshots">
      <SectionHeader
        eyebrow="App preview"
        title="See Parenfy in action"
        description="A calm, premium experience on every screen — designed for tired parents and curious kids."
      />
      <div className="flex flex-wrap justify-center gap-8 md:gap-10">
        {ITEMS.map(({ id, title }, i) => {
          const Mock = MOCKS[id];
          return (
            <PhoneFrame
              key={id}
              title={title}
              className={cn("landing-fade-up", `landing-delay-${Math.min(i + 1, 4)}`)}
            >
              <Mock />
            </PhoneFrame>
          );
        })}
      </div>
    </LandingSection>
  );
}
