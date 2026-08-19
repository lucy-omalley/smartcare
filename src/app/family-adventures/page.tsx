"use client";

import { AppShell } from "@/components/layout/app-shell";
import { FamilyAdventuresDashboard } from "@/components/family-adventures/family-adventures-dashboard";

export default function FamilyAdventuresPage() {
  return (
    <AppShell>
      <FamilyAdventuresDashboard />
    </AppShell>
  );
}
