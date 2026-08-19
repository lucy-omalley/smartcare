import type { AdventureConnector } from "@/lib/family-adventures/connectors/types";
import {
  airfieldConnector,
  dublinCityConnector,
  eventbriteConnector,
  imaginosityConnector,
  libraryConnector,
  museumConnector,
  playgroundConnector,
  seedCatalogConnector,
  zooConnector,
} from "@/lib/family-adventures/connectors/seed-catalog";
import type { FamilyAdventure } from "@/lib/family-adventures/types";

const CONNECTORS: AdventureConnector[] = [
  seedCatalogConnector,
  dublinCityConnector,
  libraryConnector,
  museumConnector,
  zooConnector,
  playgroundConnector,
  eventbriteConnector,
  imaginosityConnector,
  airfieldConnector,
];

export function listAdventureConnectors(): AdventureConnector[] {
  return CONNECTORS;
}

export async function fetchAllAdventures(): Promise<FamilyAdventure[]> {
  const batches = await Promise.all(CONNECTORS.map((c) => c.fetchAdventures()));
  const seen = new Set<string>();
  const merged: FamilyAdventure[] = [];

  for (const batch of batches) {
    for (const adventure of batch) {
      const key = adventure.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(adventure);
    }
  }

  return merged;
}

export async function getAdventureById(id: string): Promise<FamilyAdventure | null> {
  const all = await fetchAllAdventures();
  return all.find((a) => a.id === id) ?? null;
}
