import upgradeData from "@/constants/upgrade-data.json";

export type Currency = "gold" | "elixir" | "darkElixir" | "gem";

export type UpgradeStepStatus = "available" | "th_locked" | "maxed";

export interface UpgradeLevel {
  level: number;
  required_th: number;
  cost: number;
  currency: Currency;
  timeInSeconds: number;
}

export interface UpgradeBuilding {
  id: number;
  name: string;
  category: string;
  levels: UpgradeLevel[];
}

export interface UpgradeStep {
  level: number;
  cost: number;
  currency: Currency;
  timeInSeconds: number;
  requiredTh: number;
  status: UpgradeStepStatus;
  buildingCount: number;
}

export interface UpgradePathResult {
  steps: UpgradeStep[];
  thMaxLevel: number;
  absoluteMaxLevel: number;
  availableSteps: UpgradeStep[];
  totalCost: number;
  totalTimeSeconds: number;
  currency: Currency | null;
}

const buildings = upgradeData as UpgradeBuilding[];

const upgradeIndex = new Map<number, UpgradeBuilding>(
  buildings.map((b) => [b.id, b])
);

export function getUpgradeBuilding(id: number): UpgradeBuilding | undefined {
  return upgradeIndex.get(id);
}

export function getMaxLevel(id: number): number | null {
  const building = upgradeIndex.get(id);
  if (!building || building.levels.length === 0) return null;
  return Math.max(...building.levels.map((l) => l.level));
}

export function getMaxLevelForTH(buildingId: number, thLevel: number): number {
  const building = upgradeIndex.get(buildingId);
  if (!building) return 0;

  const eligible = building.levels.filter((l) => l.required_th <= thLevel);
  if (eligible.length === 0) return 0;

  return Math.max(...eligible.map((l) => l.level));
}

export function buildUpgradePath(
  buildingId: number,
  currentLevel: number,
  thLevel: number,
  buildingCount = 1
): UpgradePathResult {
  const building = upgradeIndex.get(buildingId);
  const empty: UpgradePathResult = {
    steps: [],
    thMaxLevel: currentLevel,
    absoluteMaxLevel: currentLevel,
    availableSteps: [],
    totalCost: 0,
    totalTimeSeconds: 0,
    currency: null,
  };

  if (!building) return empty;

  const thMaxLevel = getMaxLevelForTH(buildingId, thLevel);
  const absoluteMaxLevel = getMaxLevel(buildingId) ?? currentLevel;

  const steps: UpgradeStep[] = [];

  for (let targetLevel = currentLevel + 1; targetLevel <= absoluteMaxLevel; targetLevel++) {
    const levelData = building.levels.find((l) => l.level === targetLevel);
    if (!levelData) continue;

    let status: UpgradeStepStatus;
    if (targetLevel <= thMaxLevel) {
      status = "available";
    } else {
      status = "th_locked";
    }

    steps.push({
      level: targetLevel,
      cost: levelData.cost,
      currency: levelData.currency,
      timeInSeconds: levelData.timeInSeconds,
      requiredTh: levelData.required_th,
      status,
      buildingCount,
    });
  }

  const availableSteps = steps.filter((s) => s.status === "available");
  const totalCost = availableSteps.reduce(
    (sum, s) => sum + s.cost * s.buildingCount,
    0
  );
  const totalTimeSeconds = availableSteps.reduce(
    (sum, s) => sum + s.timeInSeconds * s.buildingCount,
    0
  );

  return {
    steps,
    thMaxLevel,
    absoluteMaxLevel,
    availableSteps,
    totalCost,
    totalTimeSeconds,
    currency: availableSteps[0]?.currency ?? steps[0]?.currency ?? null,
  };
}

export function mergeUpgradePaths(paths: UpgradePathResult[]): UpgradePathResult {
  if (paths.length === 0) {
    return {
      steps: [],
      thMaxLevel: 0,
      absoluteMaxLevel: 0,
      availableSteps: [],
      totalCost: 0,
      totalTimeSeconds: 0,
      currency: null,
    };
  }

  const stepMap = new Map<number, UpgradeStep>();

  for (const path of paths) {
    for (const step of path.steps) {
      const existing = stepMap.get(step.level);
      if (existing) {
        existing.buildingCount += step.buildingCount;
        existing.cost = step.cost;
        existing.timeInSeconds = step.timeInSeconds;
        existing.currency = step.currency;
        existing.requiredTh = step.requiredTh;
        if (step.status === "available") existing.status = "available";
      } else {
        stepMap.set(step.level, { ...step });
      }
    }
  }

  const steps = Array.from(stepMap.values()).sort((a, b) => a.level - b.level);
  const availableSteps = steps.filter((s) => s.status === "available");

  return {
    steps,
    thMaxLevel: paths[0].thMaxLevel,
    absoluteMaxLevel: paths[0].absoluteMaxLevel,
    availableSteps,
    totalCost: availableSteps.reduce(
      (sum, s) => sum + s.cost * s.buildingCount,
      0
    ),
    totalTimeSeconds: availableSteps.reduce(
      (sum, s) => sum + s.timeInSeconds * s.buildingCount,
      0
    ),
    currency: availableSteps[0]?.currency ?? steps[0]?.currency ?? null,
  };
}

export function formatCost(cost: number, currency: Currency): string {
  const formatted = cost.toLocaleString("tr-TR");
  const labels: Record<Currency, string> = {
    gold: "Altın",
    elixir: "İksir",
    darkElixir: "Kara İksir",
    gem: "Elmas",
  };
  return `${formatted} ${labels[currency] ?? currency}`;
}

export function formatDurationHours(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} dk`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)} saat`;
  }
  const days = Math.floor(hours / 24);
  const remaining = hours % 24;
  if (remaining < 0.1) {
    return `${days} gün`;
  }
  return `${days} gün ${remaining.toFixed(0)} saat`;
}
