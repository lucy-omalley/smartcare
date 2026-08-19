import type { FamilyAdventure } from "@/lib/family-adventures/types";

/** Plug-in connector contract for external adventure data sources */
export interface AdventureConnector {
  id: string;
  name: string;
  fetchAdventures(): Promise<FamilyAdventure[]>;
}

export type ConnectorRegistry = AdventureConnector[];
