import {
  buildUpgradePath,
  calculateTotalPendingUpgrades,
  getMaxLevel,
  getUpgradeBuilding,
  type Currency,
  type UpgradeStep,
} from "@/lib/calculator";

export const TOWN_HALL_ID = "1000001";

export interface RawBuildingEntry {
  data: number;
  cnt?: number;
  lvl?: number;
}

export interface BuildingInstance {
  instanceId: string;
  instanceNumber: number;
  level: number;
  maxLevel: number;
  upgradePath: UpgradeStep[];
  totalCost: number;
  totalTimeSeconds: number;
  currency: Currency | null;
  hasUpgrades: boolean;
  isFullyUpgraded: boolean;
  statusMessage: string | null;
}

export interface BuildingGroup {
  id: string;
  name: string;
  count: number;
  instances: BuildingInstance[];
  totalCost: number;
  totalTimeSeconds: number;
  currency: Currency | null;
  levelSummary: string;
  minLevel: number;
  maxLevelAmongBuildings: number;
  totalPendingUpgrades: number;
  isWall: boolean;
  maxLevel: number;
}

export interface TimeStats {
  totalSeconds: number;
}

export interface ParseResult {
  groups: BuildingGroup[];
  townHallLevel: number | null;
  timeStats: TimeStats;
  builderCount: number;
}

export type ParseErrorCode = "INVALID_JSON" | "NO_DATA";

export class ParseError extends Error {
  constructor(
    public code: ParseErrorCode,
    message: string
  ) {
    super(message);
    this.name = "ParseError";
  }
}

const BUILDER_HUT_ID = "1000017";

interface LevelInstance {
  level: number;
  count: number;
}

interface GroupAccumulator {
  id: string;
  instances: LevelInstance[];
}

function extractEntries(raw: unknown): RawBuildingEntry[] {
  const collect = (items: unknown[]): RawBuildingEntry[] =>
    items
      .map(parseBuildingEntry)
      .filter((entry): entry is RawBuildingEntry => entry !== null);

  if (Array.isArray(raw)) {
    return collect(raw);
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;

    if (Array.isArray(obj.buildings) || Array.isArray(obj.buildings2)) {
      const buildings = Array.isArray(obj.buildings) ? obj.buildings : [];
      const buildings2 = Array.isArray(obj.buildings2) ? obj.buildings2 : [];
      return collect([...buildings, ...buildings2]);
    }

    if (Array.isArray(obj.data)) {
      return collect(obj.data);
    }

    if (obj.player && typeof obj.player === "object") {
      const player = obj.player as Record<string, unknown>;
      const playerBuildings = Array.isArray(player.buildings) ? player.buildings : [];
      const playerBuildings2 = Array.isArray(player.buildings2) ? player.buildings2 : [];
      return collect([...playerBuildings, ...playerBuildings2]);
    }
  }

  return [];
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseBuildingEntry(value: unknown): RawBuildingEntry | null {
  if (typeof value !== "object" || value === null) return null;

  const entry = value as Record<string, unknown>;
  const data = parseNumber(entry.data ?? entry.id);
  if (data === null) return null;

  const cnt = parseNumber(entry.cnt ?? entry.count) ?? 1;
  const lvl = parseNumber(entry.lvl ?? entry.level) ?? 1;

  return { data, cnt, lvl };
}

function detectTownHallLevel(entries: RawBuildingEntry[]): number | null {
  const thEntry = entries.find(
    (e) => String(e.data) === TOWN_HALL_ID
  );
  return thEntry?.lvl ?? null;
}

function detectBuilderCount(entries: RawBuildingEntry[]): number | null {
  const builderEntries = entries.filter((e) => String(e.data) === BUILDER_HUT_ID);
  if (builderEntries.length === 0) return null;

  return builderEntries.reduce((sum, entry) => sum + (entry.cnt ?? 1), 0);
}

function groupByBuildingId(entries: RawBuildingEntry[]): GroupAccumulator[] {
  const groups = new Map<string, GroupAccumulator>();

  for (const entry of entries) {
    const id = String(entry.data);
    if (!getUpgradeBuilding(Number(id))) continue;

    const level = entry.lvl ?? 1;
    const count = entry.cnt ?? 1;

    if (!groups.has(id)) {
      groups.set(id, { id, instances: [] });
    }

    groups.get(id)!.instances.push({ level, count });
  }

  return Array.from(groups.values());
}

function formatLevelSummary(instances: LevelInstance[]): string {
  const levels = instances.flatMap((i) =>
    Array(i.count).fill(i.level) as number[]
  );
  const min = Math.min(...levels);
  const max = Math.max(...levels);

  if (min === max) return String(min);
  return `${min}–${max}`;
}

function buildInstanceStatus(
  hasUpgrades: boolean
): string | null {
  if (!hasUpgrades) {
    return "Tamamen Yükseltildi";
  }
  return null;
}

function buildBuildingGroup(
  group: GroupAccumulator,
  townHallLevel: number | null
): BuildingGroup | null {
  const buildingId = Number(group.id);
  const building = getUpgradeBuilding(buildingId);
  if (!building) return null;

  const name = building.name;
  const effectiveTH = townHallLevel ?? 1;

  // Create individual instances
  const instances: BuildingInstance[] = [];
  let instanceCounter = 0;

  for (const entry of group.instances) {
    for (let i = 0; i < entry.count; i++) {
      instanceCounter++;
      const instanceId = `${group.id}-${instanceCounter}`;

      const path = buildUpgradePath(
        buildingId,
        entry.level,
        effectiveTH,
        1
      );

      const hasUpgrades = path.availableSteps.length > 0;
      const isFullyUpgraded = !hasUpgrades;
      const statusMessage = buildInstanceStatus(hasUpgrades);

      instances.push({
        instanceId,
        instanceNumber: instanceCounter,
        level: entry.level,
        maxLevel: path.absoluteMaxLevel,
        upgradePath: path.steps,
        totalCost: path.totalCost,
        totalTimeSeconds: path.totalTimeSeconds,
        currency: path.currency,
        hasUpgrades,
        isFullyUpgraded,
        statusMessage,
      });
    }
  }

  // Calculate group totals
  const totalCost = instances.reduce((sum, inst) => sum + inst.totalCost, 0);
  const totalTimeSeconds = instances.reduce((sum, inst) => sum + inst.totalTimeSeconds, 0);
  const currency = instances.find(i => i.currency)?.currency ?? null;

  const levels = group.instances.flatMap((i) =>
    Array(i.count).fill(i.level) as number[]
  );
  const minLevel = Math.min(...levels);
  const maxLevelAmongBuildings = Math.max(...levels);
  const levelSummary = formatLevelSummary(group.instances);

  // Calculate total pending upgrades
  const totalPendingUpgrades = calculateTotalPendingUpgrades(
    group.instances,
    buildingId,
    effectiveTH
  );

  return {
    id: group.id,
    name,
    count: instances.length,
    instances,
    totalCost,
    totalTimeSeconds,
    currency,
    levelSummary,
    minLevel,
    maxLevelAmongBuildings,
    totalPendingUpgrades,
    isWall: buildingId === 1000010,
    maxLevel: getMaxLevel(buildingId) ?? 0,
  };
}

export function parseClashData(input: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch {
    throw new ParseError("INVALID_JSON", "Geçersiz JSON formatı.");
  }

  const rawEntries = extractEntries(parsed);

  if (rawEntries.length === 0) {
    throw new ParseError("NO_DATA", "Veri bulunamadı.");
  }

  const townHallLevel = detectTownHallLevel(rawEntries);
  const builderCount = detectBuilderCount(rawEntries) ?? 5;
  const grouped = groupByBuildingId(rawEntries);
  const groups = grouped
    .map((g) => buildBuildingGroup(g, townHallLevel))
    .filter((group): group is BuildingGroup => group !== null);

  const totalSeconds = groups.reduce(
    (sum, g) => sum + g.totalTimeSeconds,
    0
  );

  return {
    groups,
    townHallLevel,
    timeStats: { totalSeconds },
    builderCount,
  };
}

