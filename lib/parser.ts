import buildingMap from "@/constants/building_map.json";
import {
  buildUpgradePath,
  calculateTotalPendingUpgrades,
  type Currency,
  type UpgradeStep,
} from "@/lib/calculator";

export type BuildingMap = Record<string, string>;

export const TOWN_HALL_ID = "1000001";
export const ALLOWED_BUILDING_IDS = new Set([
  "1000008", "1000009", // Cannon, Archer Tower
  "1000011", "1000012", "1000013", // Wizard Tower, Air Defense, Mortar
  "1000014", "1000016", "1000019", // X-Bow, Inferno Tower, Hidden Tesla
  "1000023", "1000028" // Bomb Tower, Air Sweeper
]);

export interface RawBuildingEntry {
  data: number;
  cnt?: number;
  lvl?: number;
}

export interface BuildingInstance {
  instanceId: string;
  instanceNumber: number;
  level: number;
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

const map = buildingMap as BuildingMap;

interface LevelInstance {
  level: number;
  count: number;
}

interface GroupAccumulator {
  id: string;
  instances: LevelInstance[];
}

function resolveBuildingName(dataId: number): string | null {
  return map[String(dataId)] ?? null;
}

function extractEntries(raw: unknown): RawBuildingEntry[] {
  if (Array.isArray(raw)) {
    return raw.filter(isBuildingEntry);
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;

    if (Array.isArray(obj.buildings)) {
      return obj.buildings.filter(isBuildingEntry);
    }

    if (Array.isArray(obj.data)) {
      return obj.data.filter(isBuildingEntry);
    }

    if (obj.player && typeof obj.player === "object") {
      const player = obj.player as Record<string, unknown>;
      if (Array.isArray(player.buildings)) {
        return player.buildings.filter(isBuildingEntry);
      }
    }
  }

  return [];
}

function isBuildingEntry(value: unknown): value is RawBuildingEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof (value as RawBuildingEntry).data === "number"
  );
}

function detectTownHallLevel(entries: RawBuildingEntry[]): number | null {
  const thEntry = entries.find(
    (e) => String(e.data) === TOWN_HALL_ID
  );
  return thEntry?.lvl ?? null;
}

function groupByBuildingId(entries: RawBuildingEntry[]): GroupAccumulator[] {
  const groups = new Map<string, GroupAccumulator>();

  for (const entry of entries) {
    const id = String(entry.data);
    if (!ALLOWED_BUILDING_IDS.has(id)) continue;

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
): BuildingGroup {
  const buildingId = Number(group.id);
  const name = resolveBuildingName(buildingId) ?? `Bilinmeyen Bina: ${group.id}`;
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
  const grouped = groupByBuildingId(rawEntries);
  const groups = grouped.map((g) => buildBuildingGroup(g, townHallLevel));

  const totalSeconds = groups.reduce(
    (sum, g) => sum + g.totalTimeSeconds,
    0
  );

  return {
    groups,
    townHallLevel,
    timeStats: { totalSeconds },
    builderCount: 5,
  };
}

export function getBuildingMap(): BuildingMap {
  return map;
}
