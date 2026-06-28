"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Shield, Coins, Clock } from "lucide-react";
import {
  formatCost,
  type Currency,
} from "@/lib/calculator";
import { formatDurationFromSeconds } from "@/lib/time-calculator";
import type { BuildingGroup, BuildingInstance } from "@/lib/parser";
import { cn } from "@/lib/utils";

interface BuildingAccordionProps {
  groups: BuildingGroup[];
}

function UpgradeBlock({ level, cost, currency, time }: { level: number; cost: number; currency: Currency; time: number }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2 bg-muted/30 rounded border border-border/40 min-w-[100px]">
      <span className="text-xs font-semibold text-primary">Lvl {level}</span>
      <div className="flex items-center gap-1 text-xs text-foreground">
        <Coins className="size-3 text-yellow-500" />
        <span>{formatCost(cost, currency)}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3" />
        <span>{formatDurationFromSeconds(time)}</span>
      </div>
    </div>
  );
}

function InstanceRow({ instance, buildingName }: { instance: BuildingInstance; buildingName: string }) {
  const upgradeBlocks = instance.upgradePath.map((step) => ({
    level: step.level,
    cost: step.cost,
    currency: step.currency,
    time: step.timeInSeconds,
  }));

  const summaryLevels = upgradeBlocks.length;
  const summaryCost = instance.totalCost;
  const summaryTime = instance.totalTimeSeconds;

  return (
    <div className="flex items-start gap-4 px-4 py-4 border-b border-border/40 last:border-b-0 bg-card/30">
      {/* Left side: Building icon + level info */}
      <div className="flex items-center gap-3 shrink-0 min-w-[140px]">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
          <Shield className="size-5 text-primary" />
        </div>
        <div>
          <span className="text-sm font-medium text-foreground">
            {buildingName} #{instance.instanceNumber}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{instance.level}/{instance.maxLevel}</span>
          </div>
        </div>
      </div>

      {/* Right side: Upgrade path grid */}
      <div className="flex-1">
        {instance.isFullyUpgraded ? (
          <div className="flex items-center justify-center py-4 text-sm text-primary font-medium">
            Tamamen Yükseltildi
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {upgradeBlocks.map((block) => (
              <UpgradeBlock
                key={block.level}
                level={block.level}
                cost={block.cost}
                currency={block.currency}
                time={block.time}
              />
            ))}
            {/* Footer summary block */}
            <div className="flex flex-col gap-1 px-3 py-2 bg-primary/10 rounded border border-primary/30 min-w-[120px]">
              <span className="text-xs font-semibold text-primary">
                {summaryLevels} Levels
              </span>
              <div className="flex items-center gap-1 text-xs text-foreground">
                <Coins className="size-3 text-yellow-500" />
                <span>{formatCost(summaryCost, instance.currency as Currency)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>{formatDurationFromSeconds(summaryTime)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WallManagementCard({ group }: { group: BuildingGroup }) {
  const levelCounts = group.instances.reduce<Record<number, number>>((acc, instance) => {
    acc[instance.level] = (acc[instance.level] ?? 0) + 1;
    return acc;
  }, {});

  const sortedLevels = Object.keys(levelCounts)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="rounded-xl border border-border/40 bg-card/20 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Duvar Yönetimi</p>
            <p className="text-xs text-muted-foreground">
              Duvarları seviye bazında say ve toplam yükseltme maliyetini hesapla.
            </p>
          </div>
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {group.count} Duvar
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {sortedLevels.map((level) => (
            <div key={level} className="rounded-xl bg-[#0f172a] p-3 text-sm text-foreground">
              <div className="flex items-center justify-between gap-2">
                <span>Seviye {level}</span>
                <span className="font-semibold text-primary">{levelCounts[level]}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg bg-primary/5 p-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-3">
            <span>Toplam yükseltme maliyeti</span>
            <span className="font-semibold text-foreground">
              {group.currency ? formatCost(group.totalCost, group.currency as Currency) : "0"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupRow({ group }: { group: BuildingGroup }) {
  const [expanded, setExpanded] = useState(false);
  const hasInstances = group.instances.length > 0;

  return (
    <div className="border-b border-border/60 last:border-b-0 bg-[#1a2a40]">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => hasInstances && setExpanded((v) => !v)}
        disabled={!hasInstances}
        className={cn(
          "flex w-full items-center gap-4 px-4 py-4 text-left transition-colors",
          hasInstances && "hover:bg-[#24344d] cursor-pointer",
          !hasInstances && "cursor-default"
        )}
      >
        {/* Building icon */}
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
          <Shield className="size-6 text-primary" />
        </div>

        {/* Building info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-lg">{group.name}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-muted-foreground">
              {group.totalPendingUpgrades} Upgrades
            </span>
          </div>
        </div>

        {/* Summary info */}
        <div className="shrink-0 text-right">
          {group.currency ? (
            <>
              <div className="flex items-center gap-2 justify-end">
                <Coins className="size-4 text-yellow-500" />
                <p className="font-semibold text-primary text-lg">
                  {formatCost(group.totalCost, group.currency as Currency)}
                </p>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Clock className="size-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {formatDurationFromSeconds(group.totalTimeSeconds)}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tamamen Yükseltildi
            </p>
          )}
        </div>

        {/* Expand icon */}
        <div className="flex size-6 shrink-0 items-center justify-center text-muted-foreground">
          {hasInstances ? (
            expanded ? (
              <ChevronDown className="size-5" />
            ) : (
              <ChevronRight className="size-5" />
            )
          ) : (
            <span className="size-5" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && hasInstances && (
        <div className="border-t border-border/40 bg-[#121e2e]">
          {group.isWall ? (
            <WallManagementCard group={group} />
          ) : (
            <div>
              {group.instances.map((instance) => (
                <InstanceRow
                  key={instance.instanceId}
                  instance={instance}
                  buildingName={group.name}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BuildingAccordion({ groups }: BuildingAccordionProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-[#1a2a40]">
      <div>
        {groups.map((group) => (
          <GroupRow key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
