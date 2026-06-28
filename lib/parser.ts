import buildingMap from "@/constants/building_map.json";
import {
  buildUpgradePath,
  mergeUpgradePaths,
  type Currency,
  type UpgradeStep,
} from "@/lib/calculator";

export type BuildingMap = Record<string, string>;

export const TOWN_HALL_ID = "1000001";
export const ALLOWED_BUILDING_IDS = new Set(["1000008", "1000009"]);

export interface RawBuildingEntry {
  data: number;
  cnt?: number;
  lvl?: number;
}

export interface BuildingGroup {
  id: string;
  name: string;
  count: number;
  levelSummary: string;
  minLevel: number;
  maxLevelAmongBuildings: number;
  thMaxLevel: number;
  targetLevel: number;
  upgradePath: UpgradeStep[];
  totalCost: number;
  totalTimeSeconds: number;
  currency: Currency | null;
  statusMessage: string | null;
  isMaxLevel: boolean;
  hasUpgrades: boolean;
}

export interface TimeStats {
  totalSeconds: number;
}

export interface ParseResult {
  groups: BuildingGroup[];
  townHallLevel: number | null;
  timeStats: TimeStats;
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

function buildStatusMessage(
  minLevel: number,
  thMaxLevel: number,
  absoluteMaxLevel: number,
  hasUpgrades: boolean,
  townHallLevel: number | null
): string | null {
  if (townHallLevel === null) {
    return "Belediye Binası seviyesi tespit edilemedi";
  }

  if (!hasUpgrades) {
    if (minLevel >= absoluteMaxLevel) {
      return "Maksimum seviyeye ulaşıldı";
    }
    if (minLevel >= thMaxLevel) {
      return "Daha Yükselemez — TH sınırına ulaşıldı";
    }
  }

  const nextLocked = thMaxLevel < absoluteMaxLevel;
  if (nextLocked && !hasUpgrades && minLevel >= thMaxLevel) {
    const nextTh =
      absoluteMaxLevel > thMaxLevel
        ? `TH ${thMaxLevel + 1}`
        : null;
    if (nextTh) return `Daha Yükselemez — ${nextTh}'te devam eder`;
  }

  return null;
}

function buildBuildingGroup(
  group: GroupAccumulator,
  townHallLevel: number | null
): BuildingGroup {
  const buildingId = Number(group.id);
  const name = resolveBuildingName(buildingId) ?? `Bilinmeyen Bina: ${group.id}`;
  const totalCount = group.instances.reduce((sum, i) => sum + i.count, 0);
  const levelSummary = formatLevelSummary(group.instances);
  const levels = group.instances.flatMap((i) =>
    Array(i.count).fill(i.level) as number[]
  );
  const minLevel = Math.min(...levels);
  const maxLevelAmongBuildings = Math.max(...levels);

  const effectiveTH = townHallLevel ?? 1;

  const paths = group.instances.map((instance) =>
    buildUpgradePath(
      buildingId,
      instance.level,
      effectiveTH,
      instance.count
    )
  );

  const merged = mergeUpgradePaths(paths);

  const hasUpgrades = merged.availableSteps.length > 0;
  const isMaxLevel =
    minLevel >= merged.absoluteMaxLevel ||
    (minLevel >= merged.thMaxLevel && !hasUpgrades);

  const statusMessage = buildStatusMessage(
    minLevel,
    merged.thMaxLevel,
    merged.absoluteMaxLevel,
    hasUpgrades,
    townHallLevel
  );

  return {
    id: group.id,
    name,
    count: totalCount,
    levelSummary,
    minLevel,
    maxLevelAmongBuildings,
    thMaxLevel: merged.thMaxLevel,
    targetLevel: merged.thMaxLevel,
    upgradePath: merged.steps,
    totalCost: merged.totalCost,
    totalTimeSeconds: merged.totalTimeSeconds,
    currency: merged.currency,
    statusMessage,
    isMaxLevel,
    hasUpgrades,
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
  };
}

export function getBuildingMap(): BuildingMap {
  return map;
}
