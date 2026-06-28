import type { BuildingGroup } from "@/lib/parser";

export function calculateTotalSeconds(groups: BuildingGroup[]): number {
  return groups.reduce((sum, group) => sum + group.totalTimeSeconds, 0);
}

export function calculateEstimatedSeconds(
  totalSeconds: number,
  builderCount: number
): number {
  if (builderCount <= 0) return totalSeconds;
  return totalSeconds / builderCount;
}

export function formatDurationFromSeconds(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0 saat";

  const totalHours = totalSeconds / 3600;

  if (totalHours < 24) {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    if (hours === 0) return `${minutes} dk`;
    if (minutes === 0) return `${hours} saat`;
    return `${hours} saat ${minutes} dk`;
  }

  const days = Math.floor(totalHours / 24);
  const hours = Math.round(totalHours % 24);
  if (hours === 0) return `${days} gün`;
  return `${days} gün ${hours} saat`;
}
