"use client";

import { useState } from "react";
import { BuildingAccordion } from "./building-accordion";
import type { BuildingGroup } from "@/lib/parser";
import { cn } from "@/lib/utils";

interface SectionsProps {
  groups: BuildingGroup[];
}

const CATEGORY_LABELS: Record<string, string> = {
  Defense: "Savunmalar",
  Traps: "Tuzaklar",
  Lab: "Laboratuvar",
  Heroes: "Kahramanlar",
  Pets: "Evcil Hayvanlar",
  Resources: "Kaynaklar",
  Army: "Ordu",
  Other: "Diğer",
};

export function DashboardSections({ groups }: SectionsProps) {
  const categories = Array.from(new Set(groups.map((g) => g.category ?? "Other")));

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const sectionGroups = groups.filter((g) => (g.category ?? "Other") === cat);
        return (
          <section key={cat}>
            <h3 className="text-lg font-semibold text-primary mb-2">{CATEGORY_LABELS[cat] ?? cat}</h3>
            <BuildingAccordion groups={sectionGroups} />
          </section>
        );
      })}
    </div>
  );
}
