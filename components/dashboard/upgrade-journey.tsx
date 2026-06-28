"use client";

import { BuildingAccordion } from "@/components/dashboard/building-accordion";
import type { BuildingGroup } from "@/lib/parser";

interface UpgradeJourneyProps {
  groups: BuildingGroup[];
}

export function UpgradeJourney({ groups }: UpgradeJourneyProps) {
  return <BuildingAccordion groups={groups} />;
}
