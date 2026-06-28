"use client";

import { Shield, Users, Coins, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCost } from "@/lib/calculator";
import type { GlobalStats } from "@/lib/calculator";

interface SidebarProps {
  className?: string;
  townHallLevel: number | null;
  globalStats: GlobalStats | null;
}

export function Sidebar({ className, townHallLevel, globalStats }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border bg-card",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-border px-6 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15">
          <Shield className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-primary">
            Clash Logic
          </h1>
          <p className="text-xs text-muted-foreground">Village Stats</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto">
        {/* Town Hall Level */}
        <div className="flex flex-col gap-1 rounded-lg bg-primary/10 px-3 py-3 border border-primary/30">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <span className="text-xs text-muted-foreground">Belediye Binası</span>
          </div>
          <span className="text-xl font-bold text-primary">
            {townHallLevel ? `TH ${townHallLevel}` : "—"}
          </span>
        </div>

        {/* Builder Count */}
        <div className="flex flex-col gap-1 rounded-lg bg-muted/30 px-3 py-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">İnşaatçılar</span>
          </div>
          <span className="text-lg font-semibold text-foreground">
            {globalStats?.builderCount ?? 5}
          </span>
        </div>

        {/* Total Upgrades */}
        <div className="flex flex-col gap-1 rounded-lg bg-muted/30 px-3 py-3">
          <div className="flex items-center gap-2">
            <Hammer className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Kalan Yükseltmeler</span>
          </div>
          <span className="text-lg font-semibold text-foreground">
            {globalStats?.totalUpgrades ?? 0}
          </span>
        </div>

        {/* Total Cost */}
        <div className="flex flex-col gap-1 rounded-lg bg-muted/30 px-3 py-3">
          <div className="flex items-center gap-2">
            <Coins className="size-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Toplam Maliyet</span>
          </div>
          {globalStats && globalStats.totalCost > 0 ? (
            <div className="space-y-1">
              {globalStats.totalCostGold > 0 && (
                <span className="text-sm font-medium text-primary">
                  {formatCost(globalStats.totalCostGold, "gold")}
                </span>
              )}
              {globalStats.totalCostElixir > 0 && (
                <span className="text-sm font-medium text-primary">
                  {formatCost(globalStats.totalCostElixir, "elixir")}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          Clash of Clans yükseltme takip paneli.
        </p>
      </div>
    </aside>
  );
}
