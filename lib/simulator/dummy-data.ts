import type {
  DistrictHeadquarters,
  PrefectureMaster,
  Region,
  RolloutBlock,
  SimulationDataset,
  SiteRecord,
  SiteType,
} from "@/lib/simulator/types";

function normalizeTotalCounts(weights: number[], total: number) {
  const sum = weights.reduce((acc, value) => acc + value, 0);
  const raw = weights.map((weight) => (weight / sum) * total);
  const base = raw.map((value) => Math.floor(value));
  let remaining = total - base.reduce((acc, value) => acc + value, 0);
  const ranked = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (const item of ranked) {
    if (remaining <= 0) break;
    base[item.index] += 1;
    remaining -= 1;
  }

  return base;
}

function blockToRegion(block: RolloutBlock): Region {
  if (block === "北海道" || block === "東北") return "北海道・東北";
  if (block === "関東") return "関東";
  if (block === "中部") return "中部";
  if (block === "関西") return "関西";
  if (block === "中国" || block === "四国") return "中国・四国";
  return "九州・沖縄";
}

const prefectureMasters: PrefectureMaster[] = [
  { prefecture: "北海道", block: "北海道", region: blockToRegion("北海道"), lat: 43.064, lng: 141.347, weight: 18, districtHqCount: 2 },
  { prefecture: "青森", block: "東北", region: blockToRegion("東北"), lat: 40.824, lng: 140.74, weight: 5, districtHqCount: 1 },
  { prefecture: "岩手", block: "東北", region: blockToRegion("東北"), lat: 39.703, lng: 141.152, weight: 5, districtHqCount: 1 },
  { prefecture: "宮城", block: "東北", region: blockToRegion("東北"), lat: 38.268, lng: 140.872, weight: 12, districtHqCount: 1 },
  { prefecture: "秋田", block: "東北", region: blockToRegion("東北"), lat: 39.719, lng: 140.103, weight: 4, districtHqCount: 1 },
  { prefecture: "山形", block: "東北", region: blockToRegion("東北"), lat: 38.24, lng: 140.363, weight: 4, districtHqCount: 1 },
  { prefecture: "福島", block: "東北", region: blockToRegion("東北"), lat: 37.75, lng: 140.467, weight: 9, districtHqCount: 1 },
  { prefecture: "茨城", block: "関東", region: blockToRegion("関東"), lat: 36.341, lng: 140.446, weight: 14, districtHqCount: 1 },
  { prefecture: "栃木", block: "関東", region: blockToRegion("関東"), lat: 36.565, lng: 139.884, weight: 9, districtHqCount: 1 },
  { prefecture: "群馬", block: "関東", region: blockToRegion("関東"), lat: 36.391, lng: 139.06, weight: 9, districtHqCount: 1 },
  { prefecture: "埼玉", block: "関東", region: blockToRegion("関東"), lat: 35.857, lng: 139.649, weight: 22, districtHqCount: 2 },
  { prefecture: "千葉", block: "関東", region: blockToRegion("関東"), lat: 35.605, lng: 140.123, weight: 20, districtHqCount: 2 },
  { prefecture: "東京", block: "関東", region: blockToRegion("関東"), lat: 35.689, lng: 139.692, weight: 48, districtHqCount: 4 },
  { prefecture: "神奈川", block: "関東", region: blockToRegion("関東"), lat: 35.447, lng: 139.642, weight: 26, districtHqCount: 2 },
  { prefecture: "新潟", block: "中部", region: blockToRegion("中部"), lat: 37.902, lng: 139.023, weight: 11, districtHqCount: 1 },
  { prefecture: "富山", block: "中部", region: blockToRegion("中部"), lat: 36.695, lng: 137.211, weight: 4, districtHqCount: 1 },
  { prefecture: "石川", block: "中部", region: blockToRegion("中部"), lat: 36.594, lng: 136.625, weight: 5, districtHqCount: 1 },
  { prefecture: "福井", block: "中部", region: blockToRegion("中部"), lat: 36.065, lng: 136.221, weight: 4, districtHqCount: 1 },
  { prefecture: "山梨", block: "中部", region: blockToRegion("中部"), lat: 35.664, lng: 138.568, weight: 4, districtHqCount: 1 },
  { prefecture: "長野", block: "中部", region: blockToRegion("中部"), lat: 36.651, lng: 138.181, weight: 10, districtHqCount: 1 },
  { prefecture: "岐阜", block: "中部", region: blockToRegion("中部"), lat: 35.391, lng: 136.722, weight: 9, districtHqCount: 1 },
  { prefecture: "静岡", block: "中部", region: blockToRegion("中部"), lat: 34.977, lng: 138.383, weight: 15, districtHqCount: 1 },
  { prefecture: "愛知", block: "中部", region: blockToRegion("中部"), lat: 35.181, lng: 136.906, weight: 24, districtHqCount: 2 },
  { prefecture: "三重", block: "中部", region: blockToRegion("中部"), lat: 34.73, lng: 136.508, weight: 8, districtHqCount: 1 },
  { prefecture: "滋賀", block: "関西", region: blockToRegion("関西"), lat: 35.004, lng: 135.868, weight: 7, districtHqCount: 1 },
  { prefecture: "京都", block: "関西", region: blockToRegion("関西"), lat: 35.021, lng: 135.755, weight: 12, districtHqCount: 1 },
  { prefecture: "大阪", block: "関西", region: blockToRegion("関西"), lat: 34.686, lng: 135.52, weight: 30, districtHqCount: 3 },
  { prefecture: "兵庫", block: "関西", region: blockToRegion("関西"), lat: 34.691, lng: 135.183, weight: 18, districtHqCount: 2 },
  { prefecture: "奈良", block: "関西", region: blockToRegion("関西"), lat: 34.685, lng: 135.832, weight: 6, districtHqCount: 1 },
  { prefecture: "和歌山", block: "関西", region: blockToRegion("関西"), lat: 34.226, lng: 135.167, weight: 4, districtHqCount: 1 },
  { prefecture: "鳥取", block: "中国", region: blockToRegion("中国"), lat: 35.503, lng: 134.238, weight: 3, districtHqCount: 1 },
  { prefecture: "島根", block: "中国", region: blockToRegion("中国"), lat: 35.472, lng: 133.051, weight: 3, districtHqCount: 1 },
  { prefecture: "岡山", block: "中国", region: blockToRegion("中国"), lat: 34.661, lng: 133.935, weight: 9, districtHqCount: 1 },
  { prefecture: "広島", block: "中国", region: blockToRegion("中国"), lat: 34.396, lng: 132.459, weight: 13, districtHqCount: 1 },
  { prefecture: "山口", block: "中国", region: blockToRegion("中国"), lat: 34.186, lng: 131.471, weight: 6, districtHqCount: 1 },
  { prefecture: "徳島", block: "四国", region: blockToRegion("四国"), lat: 34.066, lng: 134.559, weight: 4, districtHqCount: 1 },
  { prefecture: "香川", block: "四国", region: blockToRegion("四国"), lat: 34.34, lng: 134.043, weight: 5, districtHqCount: 1 },
  { prefecture: "愛媛", block: "四国", region: blockToRegion("四国"), lat: 33.841, lng: 132.766, weight: 6, districtHqCount: 1 },
  { prefecture: "高知", block: "四国", region: blockToRegion("四国"), lat: 33.559, lng: 133.531, weight: 4, districtHqCount: 1 },
  { prefecture: "福岡", block: "九州・沖縄", region: blockToRegion("九州・沖縄"), lat: 33.607, lng: 130.418, weight: 18, districtHqCount: 2 },
  { prefecture: "佐賀", block: "九州・沖縄", region: blockToRegion("九州・沖縄"), lat: 33.249, lng: 130.299, weight: 5, districtHqCount: 1 },
  { prefecture: "長崎", block: "九州・沖縄", region: blockToRegion("九州・沖縄"), lat: 32.744, lng: 129.873, weight: 6, districtHqCount: 1 },
  { prefecture: "熊本", block: "九州・沖縄", region: blockToRegion("九州・沖縄"), lat: 32.79, lng: 130.742, weight: 8, districtHqCount: 1 },
  { prefecture: "大分", block: "九州・沖縄", region: blockToRegion("九州・沖縄"), lat: 33.238, lng: 131.612, weight: 6, districtHqCount: 1 },
  { prefecture: "宮崎", block: "九州・沖縄", region: blockToRegion("九州・沖縄"), lat: 31.911, lng: 131.424, weight: 5, districtHqCount: 1 },
  { prefecture: "鹿児島", block: "九州・沖縄", region: blockToRegion("九州・沖縄"), lat: 31.56, lng: 130.558, weight: 8, districtHqCount: 1 },
  { prefecture: "沖縄", block: "九州・沖縄", region: blockToRegion("九州・沖縄"), lat: 26.212, lng: 127.681, weight: 8, districtHqCount: 1 },
];

const hqOffsets: Array<{ lat: number; lng: number; label: string }> = [
  { lat: 0, lng: 0, label: "中央" },
  { lat: 0.16, lng: 0.18, label: "東" },
  { lat: -0.16, lng: -0.14, label: "西" },
  { lat: 0.12, lng: -0.2, label: "南" },
  { lat: -0.12, lng: 0.22, label: "北" },
];

function siteTypeFromIndex(index: number): SiteType {
  const slot = index % 10;
  if (slot <= 6) return "販売店";
  if (slot <= 8) return "営業所";
  return "事務所";
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const inner =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(inner), Math.sqrt(1 - inner));
}

function buildDistrictHqs(prefectures: PrefectureMaster[]) {
  const districtHqs: DistrictHeadquarters[] = [];

  for (const prefecture of prefectures) {
    for (let index = 0; index < prefecture.districtHqCount; index += 1) {
      const offset = hqOffsets[index] ?? hqOffsets[0];
      districtHqs.push({
        id: `HQ-${String(districtHqs.length + 1).padStart(3, "0")}`,
        name:
          prefecture.districtHqCount === 1
            ? `${prefecture.prefecture}地区本部`
            : `${prefecture.prefecture}地区本部${offset.label}`,
        prefecture: prefecture.prefecture,
        region: prefecture.region,
        block: prefecture.block,
        lat: Number((prefecture.lat + offset.lat).toFixed(4)),
        lng: Number((prefecture.lng + offset.lng).toFixed(4)),
        managedSiteIds: [],
        managedSiteCount: 0,
      });
    }
  }

  return districtHqs;
}

function buildSites(
  prefectures: PrefectureMaster[],
  districtHqs: DistrictHeadquarters[],
) {
  const siteCounts = normalizeTotalCounts(
    prefectures.map((item) => item.weight),
    900,
  );
  const sites: SiteRecord[] = [];
  let globalIndex = 0;

  prefectures.forEach((prefecture, prefectureIndex) => {
    const count = siteCounts[prefectureIndex];
    const hqsInPrefecture = districtHqs.filter(
      (hq) => hq.prefecture === prefecture.prefecture,
    );

    for (let localIndex = 0; localIndex < count; localIndex += 1) {
      const angle = (localIndex * 37 + prefectureIndex * 19) % 360;
      const radius = 0.03 + ((localIndex % 7) * 0.018);
      const lat = Number(
        (
          prefecture.lat +
          Math.sin((angle * Math.PI) / 180) * radius
        ).toFixed(4),
      );
      const lng = Number(
        (
          prefecture.lng +
          Math.cos((angle * Math.PI) / 180) * radius * 1.3
        ).toFixed(4),
      );
      const type = siteTypeFromIndex(globalIndex);
      const districtHq = [...hqsInPrefecture].sort(
        (left, right) =>
          distanceKm({ lat, lng }, { lat: left.lat, lng: left.lng }) -
          distanceKm({ lat, lng }, { lat: right.lat, lng: right.lng }),
      )[0];

      sites.push({
        id: `SITE-${String(globalIndex + 1).padStart(4, "0")}`,
        name: `${prefecture.prefecture}${type}${String(localIndex + 1).padStart(3, "0")}`,
        prefecture: prefecture.prefecture,
        region: prefecture.region,
        block: prefecture.block,
        type,
        lat,
        lng,
        districtHqId: districtHq.id,
      });
      globalIndex += 1;
    }
  });

  return sites;
}

function attachSiteCounts(
  districtHqs: DistrictHeadquarters[],
  sites: SiteRecord[],
) {
  const siteIdsByHq = new Map<string, string[]>();
  for (const site of sites) {
    const current = siteIdsByHq.get(site.districtHqId) ?? [];
    current.push(site.id);
    siteIdsByHq.set(site.districtHqId, current);
  }

  return districtHqs.map((hq) => {
    const managedSiteIds = siteIdsByHq.get(hq.id) ?? [];
    return {
      ...hq,
      managedSiteIds,
      managedSiteCount: managedSiteIds.length,
    };
  });
}

const baseDistrictHqs = buildDistrictHqs(prefectureMasters);
const sites = buildSites(prefectureMasters, baseDistrictHqs);
const districtHqs = attachSiteCounts(baseDistrictHqs, sites);

export const simulationDataset: SimulationDataset = {
  sites,
  districtHqs,
  prefectures: prefectureMasters,
};
