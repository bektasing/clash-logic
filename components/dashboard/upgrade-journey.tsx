"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Building2, Lock } from "lucide-react";
import {
  formatCost,
  type Currency,
} from "@/lib/calculator";
import { formatDurationFromSeconds } from "@/lib/time-calculator";
import type { BuildingGroup } from "@/lib/parser";
import { cn } from "@/lib/utils";

interface UpgradeJourneyProps {
  groups: BuildingGroup[];
}

function StepRow({
  step,
}: {
  step: BuildingGroup["upgradePath"][number];
}) {
  const isLocked = step.status === "th_locked";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-2.5 text-sm",
        isLocked && "opacity-50"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-md text-xs font-bold",
            isLocked
              ? "bg-muted text-muted-foreground"
              : "bg-primary/15 text-primary"
          )}
        >
          {step.level}
        </span>
        <div>
          <span className="font-medium">Seviye {step.level}</span>
          {step.buildingCount > 1 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ×{step.buildingCount}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 text-right">
        {isLocked ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" />
            TH {step.requiredTh}&apos;te açılır
          </span>
        ) : (
          <>
            <span className="hidden text-primary sm:inline">
              {formatCost(step.cost * step.buildingCount, step.currency)}
            </span>
            <span className="text-muted-foreground">
              {formatDurationFromSeconds(step.timeInSeconds * step.buildingCount)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function GroupRow({ group }: { group: BuildingGroup }) {
  const [expanded, setExpanded] = useState(false);
  const hasPath = group.upgradePath.length > 0;

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={() => hasPath && setExpanded((v) => !v)}
        disabled={!hasPath}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors",
          hasPath && "hover:bg-muted/30 cursor-pointer",
          !hasPath && "cursor-default"
        )}
      >
        <div className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">
          {hasPath ? (
            expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )
          ) : (
            <span className="size-4" />
          )}
        </div>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="size-4 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{group.name}</span>
            {group.count > 1 && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                ×{group.count}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Seviye {group.levelSummary}
            {group.hasUpgrades && (
              <span>
                {" "}
                → {group.targetLevel}
              </span>
            )}
          </p>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          {group.hasUpgrades && group.currency ? (
            <p className="font-medium text-primary">
              {formatCost(group.totalCost, group.currency as Currency)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
          {group.hasUpgrades ? (
            <p className="text-xs text-muted-foreground">
              {formatDurationFromSeconds(group.totalTimeSeconds)}
            </p>
          ) : group.statusMessage ? (
            <p className="max-w-[140px] text-xs text-muted-foreground">
              {group.statusMessage}
            </p>
          ) : null}
        </div>
      </button>

      {/* Mobile summary */}
      <div className="flex justify-between px-4 pb-3 sm:hidden">
        {group.hasUpgrades && group.currency ? (
          <>
            <span className="text-sm font-medium text-primary">
              {formatCost(group.totalCost, group.currency as Currency)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDurationFromSeconds(group.totalTimeSeconds)}
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">
            {group.statusMessage ?? "—"}
          </span>
        )}
      </div>

      {expanded && hasPath && (
        <div className="border-t border-border/40 bg-muted/10">
          <div className="px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Yükseltme Yolu
            </p>
          </div>
          <div className="divide-y divide-border/30">
            {group.upgradePath.map((step) => (
              <StepRow key={step.level} step={step} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function UpgradeJourney({ groups }: UpgradeJourneyProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <div className="hidden border-b border-border/60 bg-muted/20 px-4 py-3 sm:grid sm:grid-cols-[1fr_auto] sm:gap-4">
        <span className="pl-16 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Bina
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Toplam Maliyet / Süre
        </span>
      </div>
      <div>
        {groups.map((group) => (
          <GroupRow key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
