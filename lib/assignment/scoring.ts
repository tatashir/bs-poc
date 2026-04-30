import { calculateDistanceKm, hasCoordinates } from "@/lib/assignment/distance";
import type {
  AssignmentCandidate,
  AssignmentConfidence,
  AssignmentWarning,
  CarrierOffice,
  Region,
  TargetSite,
} from "@/lib/assignment/types";
import { uniqueWarnings } from "@/lib/assignment/warnings";

const prefectureToRegionEntries: Array<[string, Region]> = [
  ["北海道", "北海道・東北"],
  ["青森", "北海道・東北"],
  ["岩手", "北海道・東北"],
  ["宮城", "北海道・東北"],
  ["秋田", "北海道・東北"],
  ["山形", "北海道・東北"],
  ["福島", "北海道・東北"],
  ["茨城", "関東"],
  ["栃木", "関東"],
  ["群馬", "関東"],
  ["埼玉", "関東"],
  ["千葉", "関東"],
  ["東京", "関東"],
  ["神奈川", "関東"],
  ["新潟", "中部"],
  ["富山", "中部"],
  ["石川", "中部"],
  ["福井", "中部"],
  ["山梨", "中部"],
  ["長野", "中部"],
  ["岐阜", "中部"],
  ["静岡", "中部"],
  ["愛知", "中部"],
  ["三重", "中部"],
  ["滋賀", "関西"],
  ["京都", "関西"],
  ["大阪", "関西"],
  ["兵庫", "関西"],
  ["奈良", "関西"],
  ["和歌山", "関西"],
  ["鳥取", "中国・四国"],
  ["島根", "中国・四国"],
  ["岡山", "中国・四国"],
  ["広島", "中国・四国"],
  ["山口", "中国・四国"],
  ["徳島", "中国・四国"],
  ["香川", "中国・四国"],
  ["愛媛", "中国・四国"],
  ["高知", "中国・四国"],
  ["福岡", "九州・沖縄"],
  ["佐賀", "九州・沖縄"],
  ["長崎", "九州・沖縄"],
  ["熊本", "九州・沖縄"],
  ["大分", "九州・沖縄"],
  ["宮崎", "九州・沖縄"],
  ["鹿児島", "九州・沖縄"],
  ["沖縄", "九州・沖縄"],
];

const prefectureToRegion = new Map(prefectureToRegionEntries);

export function normalizePrefecture(value: string) {
  return value.trim().replace(/都|道|府|県$/u, "");
}

export function getRegionFromPrefecture(prefecture: string): Region | null {
  return prefectureToRegion.get(normalizePrefecture(prefecture)) ?? null;
}

function distanceScore(distanceKm: number | null) {
  if (distanceKm === null) return 15;
  if (distanceKm <= 20) return 35;
  if (distanceKm <= 50) return 30;
  if (distanceKm <= 100) return 24;
  if (distanceKm <= 200) return 18;
  if (distanceKm <= 400) return 10;
  return 2;
}

export function scoreCandidate(
  site: TargetSite,
  office: CarrierOffice,
  currentLoad: number,
): AssignmentCandidate {
  const samePrefecture =
    normalizePrefecture(site.prefecture) === normalizePrefecture(office.prefecture);
  const inServiceArea = office.serviceArea.some(
    (prefecture) =>
      normalizePrefecture(prefecture) === normalizePrefecture(site.prefecture),
  );
  const sameRegion = Boolean(site.region && office.region && site.region === office.region);
  const capacityAvailable = currentLoad < office.monthlyCapacity;
  const distanceKm =
    hasCoordinates(site) && hasCoordinates(office)
      ? Number(calculateDistanceKm(site, office).toFixed(1))
      : null;

  let score = 0;
  if (inServiceArea) score += 40;
  if (samePrefecture) score += 30;
  if (sameRegion) score += 12;
  if (capacityAvailable) score += 15;
  score += distanceScore(distanceKm);

  return {
    officeId: office.officeId,
    score,
    distanceKm,
    samePrefecture,
    inServiceArea,
    sameRegion,
    capacityAvailable,
  };
}

export function buildWarnings(
  candidate: AssignmentCandidate | null,
  siteWarnings: AssignmentWarning[],
  officeWarnings: AssignmentWarning[],
  manuallyOverridden: boolean,
): AssignmentWarning[] {
  const warnings = [...siteWarnings, ...officeWarnings];

  if (!candidate) warnings.push("NO_CANDIDATE");
  if (candidate && !candidate.inServiceArea) warnings.push("OUT_OF_SERVICE_AREA");
  if (candidate && !candidate.capacityAvailable) warnings.push("CAPACITY_EXCEEDED");
  if (candidate && candidate.distanceKm !== null && candidate.distanceKm > 120)
    warnings.push("FAR_DISTANCE");
  if (manuallyOverridden) warnings.push("MANUAL_OVERRIDE");

  return uniqueWarnings(warnings);
}

export function deriveConfidence(
  candidate: AssignmentCandidate | null,
  warnings: AssignmentWarning[],
): AssignmentConfidence {
  if (!candidate) return "low";
  if (
    candidate.samePrefecture &&
    candidate.inServiceArea &&
    candidate.capacityAvailable &&
    (candidate.distanceKm === null || candidate.distanceKm <= 50) &&
    warnings.length === 0
  ) {
    return "high";
  }

  if (
    candidate.inServiceArea &&
    candidate.sameRegion &&
    !warnings.includes("CAPACITY_EXCEEDED") &&
    !warnings.includes("OUT_OF_SERVICE_AREA")
  ) {
    return "medium";
  }

  return "low";
}
