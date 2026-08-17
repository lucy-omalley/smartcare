import { Check } from "lucide-react";
import { TRUST_BADGES } from "@/lib/landing/v2-content";

export function TrustBadges() {
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground">
      {TRUST_BADGES.map((badge) => (
        <li key={badge} className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
          <span>{badge}</span>
        </li>
      ))}
    </ul>
  );
}
