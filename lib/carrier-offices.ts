import type { Region, Site } from "@/lib/scheduler";

export type CarrierOffice = {
  id: string;
  name: string;
  region: Region;
  prefecture: string;
  latitude: number;
  longitude: number;
  engineers: number;
  vehicles: number;
  monthlyCapacity: number;
  serviceRegions: Region[];
};

export type CarrierAssignment = {
  siteId: string;
  carrierOfficeId: string;
  distanceKm: number;
  reason: string;
};

export type CarrierLoad = {
  office: CarrierOffice;
  assignedSites: number;
  estimatedMonthlyLoad: number;
  totalCapacity: number;
  loadRatio: number;
  engineerLoadRatio: number;
  vehicleLoadRatio: number;
  warnings: string[];
};

export type CarrierProvider = "docomo-business" | "kddi-business" | "softbank-business";

export const carrierProviderOptions: {
  value: CarrierProvider;
  label: string;
  description: string;
  sourceNote: string;
}[] = [
  {
    value: "docomo-business",
    label: "NTTドコモ系",
    description: "支社・支店が全国に広く分布する、地域密着寄りの体制モデル。",
    sourceNote: "NTTドコモ/NTTドコモビジネス系の公開支社・支店配置を参考",
  },
  {
    value: "kddi-business",
    label: "KDDI系",
    description: "地域会社と主要都市拠点で全国をカバーする、ブロック統括寄りの体制モデル。",
    sourceNote: "KDDIまとめてオフィスの地域会社/エリア拠点公開情報を参考",
  },
  {
    value: "softbank-business",
    label: "SoftBank系",
    description: "首都圏・関西・データセンター集積地を厚めに置く、都市集中寄りの体制モデル。",
    sourceNote: "SoftBank法人サービス/国内データセンター配置の公開情報を参考",
  },
];

export const initialCarrierProvider: CarrierProvider = "docomo-business";

function office(
  id: string,
  name: string,
  region: Region,
  prefecture: string,
  latitude: number,
  longitude: number,
  engineers: number,
  vehicles: number,
  monthlyCapacity: number,
  serviceRegions: Region[],
): CarrierOffice {
  return { id, name, region, prefecture, latitude, longitude, engineers, vehicles, monthlyCapacity, serviceRegions };
}

export function createCarrierOffices(provider: CarrierProvider): CarrierOffice[] {
  if (provider === "kddi-business") {
    return [
      office("KDDI-001", "札幌フィールドオフィス", "北海道・東北", "北海道", 43.06, 141.35, 12, 6, 24, ["北海道・東北"]),
      office("KDDI-002", "仙台フィールドオフィス", "北海道・東北", "宮城", 38.27, 140.87, 18, 9, 36, ["北海道・東北"]),
      office("KDDI-003", "首都圏統括オフィス", "関東", "東京", 35.7, 139.75, 56, 24, 112, ["関東"]),
      office("KDDI-004", "関東北部サテライト", "関東", "埼玉", 35.89, 139.63, 18, 8, 36, ["関東"]),
      office("KDDI-005", "名古屋フィールドオフィス", "中部", "愛知", 35.17, 136.88, 28, 13, 56, ["中部"]),
      office("KDDI-006", "金沢サテライト", "中部", "石川", 36.56, 136.65, 10, 5, 20, ["中部", "関西"]),
      office("KDDI-007", "大阪統括オフィス", "関西", "大阪", 34.7, 135.49, 38, 17, 76, ["関西"]),
      office("KDDI-008", "広島フィールドオフィス", "中国・四国", "広島", 34.39, 132.46, 18, 8, 36, ["中国・四国"]),
      office("KDDI-009", "高松サテライト", "中国・四国", "香川", 34.34, 134.04, 10, 5, 20, ["中国・四国"]),
      office("KDDI-010", "福岡フィールドオフィス", "九州・沖縄", "福岡", 33.59, 130.4, 24, 11, 48, ["九州・沖縄"]),
    ];
  }

  if (provider === "softbank-business") {
    return [
      office("SB-001", "札幌ネットワークサポート", "北海道・東北", "北海道", 43.06, 141.35, 10, 5, 20, ["北海道・東北"]),
      office("SB-002", "白河・仙台サポート", "北海道・東北", "福島", 37.13, 140.21, 16, 8, 32, ["北海道・東北", "関東"]),
      office("SB-003", "東京第一フィールド", "関東", "東京", 35.66, 139.75, 52, 22, 104, ["関東"]),
      office("SB-004", "東京西部フィールド", "関東", "東京", 35.67, 139.49, 26, 11, 52, ["関東"]),
      office("SB-005", "名古屋フィールド", "中部", "愛知", 35.18, 136.91, 22, 10, 44, ["中部"]),
      office("SB-006", "大阪フィールド", "関西", "大阪", 34.69, 135.5, 34, 15, 68, ["関西"]),
      office("SB-007", "大阪北サテライト", "関西", "大阪", 34.76, 135.52, 16, 7, 32, ["関西", "中国・四国"]),
      office("SB-008", "北九州フィールド", "九州・沖縄", "福岡", 33.88, 130.88, 20, 9, 40, ["九州・沖縄", "中国・四国"]),
      office("SB-009", "大分サテライト", "九州・沖縄", "大分", 33.24, 131.61, 10, 5, 20, ["九州・沖縄"]),
    ];
  }

  return [
    office("DOCOMO-001", "札幌支社施工センター", "北海道・東北", "北海道", 43.06, 141.35, 14, 7, 28, ["北海道・東北"]),
    office("DOCOMO-002", "仙台支社施工センター", "北海道・東北", "宮城", 38.27, 140.87, 18, 9, 36, ["北海道・東北"]),
    office("DOCOMO-003", "さいたま関信越センター", "関東", "埼玉", 35.89, 139.63, 22, 10, 44, ["関東", "中部"]),
    office("DOCOMO-004", "首都圏支社施工センター", "関東", "東京", 35.7, 139.74, 48, 20, 96, ["関東"]),
    office("DOCOMO-005", "名古屋支社施工センター", "中部", "愛知", 35.18, 136.9, 28, 13, 56, ["中部"]),
    office("DOCOMO-006", "金沢北陸サテライト", "中部", "石川", 36.56, 136.65, 12, 6, 24, ["中部"]),
    office("DOCOMO-007", "大阪支社施工センター", "関西", "大阪", 34.69, 135.5, 36, 16, 72, ["関西"]),
    office("DOCOMO-008", "広島支社施工センター", "中国・四国", "広島", 34.39, 132.46, 16, 8, 32, ["中国・四国"]),
    office("DOCOMO-009", "高松四国サテライト", "中国・四国", "香川", 34.34, 134.04, 10, 5, 20, ["中国・四国"]),
    office("DOCOMO-010", "福岡支社施工センター", "九州・沖縄", "福岡", 33.59, 130.4, 24, 11, 48, ["九州・沖縄"]),
    office("DOCOMO-011", "那覇施工サテライト", "九州・沖縄", "沖縄", 26.21, 127.68, 8, 4, 16, ["九州・沖縄"]),
  ];
}

export const initialCarrierOffices: CarrierOffice[] = createCarrierOffices(initialCarrierProvider);

function distanceKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const earthRadiusKm = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function assignSitesToCarrierOffices(sites: Site[], carrierOffices: CarrierOffice[]): CarrierAssignment[] {
  if (carrierOffices.length === 0) return [];

  return sites.map((site) => {
    const candidates = carrierOffices.filter((office) => office.serviceRegions.includes(site.region));
    const targetOffices = candidates.length > 0 ? candidates : carrierOffices;
    const selected = targetOffices
      .map((office) => ({
        office,
        distanceKm: distanceKm(site, office),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];

    return {
      siteId: site.id,
      carrierOfficeId: selected.office.id,
      distanceKm: Math.round(selected.distanceKm),
      reason: `${site.region}を担当可能な通信回線業者拠点のうち、地理的に近い${selected.office.name}へ割当`,
    };
  });
}

export function calculateCarrierLoads(
  carrierOffices: CarrierOffice[],
  assignments: CarrierAssignment[],
  monthsCount: number,
): CarrierLoad[] {
  const safeMonthsCount = Math.max(1, monthsCount);

  return carrierOffices.map((office) => {
    const assignedSites = assignments.filter((assignment) => assignment.carrierOfficeId === office.id).length;
    const totalCapacity = office.monthlyCapacity * safeMonthsCount;
    const estimatedMonthlyLoad = Math.ceil(assignedSites / safeMonthsCount);
    const loadRatio = totalCapacity === 0 ? 0 : Math.round((assignedSites / totalCapacity) * 100);
    const engineerCapacity = office.engineers * safeMonthsCount * 3;
    const vehicleCapacity = office.vehicles * safeMonthsCount * 6;
    const engineerLoadRatio = engineerCapacity === 0 ? 0 : Math.round((assignedSites / engineerCapacity) * 100);
    const vehicleLoadRatio = vehicleCapacity === 0 ? 0 : Math.round((assignedSites / vehicleCapacity) * 100);
    const warnings: string[] = [];

    if (loadRatio > 100) warnings.push("月次施工能力超過");
    if (engineerLoadRatio > 100) warnings.push("人員能力超過");
    if (vehicleLoadRatio > 100) warnings.push("車両能力超過");
    if (loadRatio >= 85 && loadRatio <= 100) warnings.push("高負荷");

    return {
      office,
      assignedSites,
      estimatedMonthlyLoad,
      totalCapacity,
      loadRatio,
      engineerLoadRatio,
      vehicleLoadRatio,
      warnings,
    };
  });
}
