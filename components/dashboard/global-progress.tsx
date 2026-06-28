"use client";

import { Clock, Users } from "lucide-react";
import { formatDurationFromSeconds } from "@/lib/time-calculator";
import type { GlobalStats } from "@/lib/calculator";
import { cn } from "@/lib/utils";

interface GlobalProgressProps {
  globalStats: GlobalStats;
  className?: string;
}

export function GlobalProgress({ globalStats, className }: GlobalProgressProps) {
  const singleBuilderTime = globalStats.totalTimeSeconds;
  const realTime = Math.ceil(singleBuilderTime / globalStats.builderCount);

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border border-border/60 bg-[#1a2a40]",
      className
    )}>
      <div className="px-4 py-3 border-b border-border/40">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
          Genel İlerleme
        </h3>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="size-5 text-primary" />
          <span className="text-sm text-foreground font-medium">
            Tüm Yükseltmeler İçin Toplam Süre
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">
              Tek İnşaatçı
            </p>
            <p className="text-lg font-semibold text-primary">
              {formatDurationFromSeconds(singleBuilderTime)}
            </p>
          </div>
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/30">
            <div className="flex items-center gap-1 mb-1">
              <Users className="size-3 text-primary" />
              <p className="text-xs text-muted-foreground">
                Gerçek Süre ({globalStats.builderCount} İnşaatçı)
              </p>
            </div>
            <p className="text-lg font-semibold text-primary">
              {formatDurationFromSeconds(realTime)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
