"use client";

import { AppShell } from "@/components/layout/app-shell";
import { FamilyAdventureDetail } from "@/components/family-adventures/family-adventure-detail";

export default function FamilyAdventureDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppShell>
      <FamilyAdventureDetail adventureId={params.id} />
    </AppShell>
  );
}
