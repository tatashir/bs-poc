import type { Region, Site } from "@/lib/scheduler";

export const regions: Region[] = ["北海道・東北", "関東", "中部", "関西", "中国・四国", "九州・沖縄"];
export const monthOptions = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

export type SiteSet = "sample" | "scale-10" | "scale-100" | "scale-1000" | "scale-3000";

export const siteSetOptions: { value: SiteSet; label: string; description: string }[] = [
  { value: "sample", label: "サンプル8拠点", description: "入力内容を確認するための最小データ" },
  { value: "scale-10", label: "10拠点", description: "全国主要都市に拠点を持つ本社・支社モデル" },
  { value: "scale-100", label: "100拠点", description: "RIZAP級の専門店舗・サービス拠点モデル" },
  { value: "scale-1000", label: "1000拠点", description: "コメダ・吉野家級の全国チェーンモデル" },
  { value: "scale-3000", label: "3000拠点", description: "すかいらーく級の大規模外食チェーンモデル" },
];

const prefectureMasters: {
  prefecture: string;
  region: Region;
  latitude: number;
  longitude: number;
  weight: number;
}[] = [
  { prefecture: "北海道", region: "北海道・東北", latitude: 43.06, longitude: 141.35, weight: 5 },
  { prefecture: "青森", region: "北海道・東北", latitude: 40.82, longitude: 140.74, weight: 1 },
  { prefecture: "岩手", region: "北海道・東北", latitude: 39.7, longitude: 141.15, weight: 1 },
  { prefecture: "宮城", region: "北海道・東北", latitude: 38.27, longitude: 140.87, weight: 3 },
  { prefecture: "秋田", region: "北海道・東北", latitude: 39.72, longitude: 140.1, weight: 1 },
  { prefecture: "山形", region: "北海道・東北", latitude: 38.24, longitude: 140.36, weight: 1 },
  { prefecture: "福島", region: "北海道・東北", latitude: 37.76, longitude: 140.47, weight: 2 },
  { prefecture: "茨城", region: "関東", latitude: 36.37, longitude: 140.47, weight: 3 },
  { prefecture: "栃木", region: "関東", latitude: 36.56, longitude: 139.88, weight: 2 },
  { prefecture: "群馬", region: "関東", latitude: 36.39, longitude: 139.06, weight: 2 },
  { prefecture: "埼玉", region: "関東", latitude: 35.86, longitude: 139.65, weight: 7 },
  { prefecture: "千葉", region: "関東", latitude: 35.61, longitude: 140.12, weight: 6 },
  { prefecture: "東京", region: "関東", latitude: 35.68, longitude: 139.76, weight: 13 },
  { prefecture: "神奈川", region: "関東", latitude: 35.44, longitude: 139.64, weight: 9 },
  { prefecture: "新潟", region: "中部", latitude: 37.9, longitude: 139.02, weight: 2 },
  { prefecture: "富山", region: "中部", latitude: 36.7, longitude: 137.21, weight: 1 },
  { prefecture: "石川", region: "中部", latitude: 36.56, longitude: 136.66, weight: 1 },
  { prefecture: "福井", region: "中部", latitude: 36.06, longitude: 136.22, weight: 1 },
  { prefecture: "山梨", region: "中部", latitude: 35.66, longitude: 138.57, weight: 1 },
  { prefecture: "長野", region: "中部", latitude: 36.65, longitude: 138.18, weight: 2 },
  { prefecture: "岐阜", region: "中部", latitude: 35.42, longitude: 136.76, weight: 2 },
  { prefecture: "静岡", region: "中部", latitude: 34.98, longitude: 138.38, weight: 4 },
  { prefecture: "愛知", region: "中部", latitude: 35.18, longitude: 136.9, weight: 8 },
  { prefecture: "三重", region: "中部", latitude: 34.73, longitude: 136.51, weight: 2 },
  { prefecture: "滋賀", region: "関西", latitude: 35.0, longitude: 135.87, weight: 1 },
  { prefecture: "京都", region: "関西", latitude: 35.01, longitude: 135.76, weight: 3 },
  { prefecture: "大阪", region: "関西", latitude: 34.69, longitude: 135.5, weight: 9 },
  { prefecture: "兵庫", region: "関西", latitude: 34.69, longitude: 135.18, weight: 5 },
  { prefecture: "奈良", region: "関西", latitude: 34.69, longitude: 135.83, weight: 1 },
  { prefecture: "和歌山", region: "関西", latitude: 34.23, longitude: 135.17, weight: 1 },
  { prefecture: "鳥取", region: "中国・四国", latitude: 35.5, longitude: 134.24, weight: 1 },
  { prefecture: "島根", region: "中国・四国", latitude: 35.47, longitude: 133.05, weight: 1 },
  { prefecture: "岡山", region: "中国・四国", latitude: 34.66, longitude: 133.92, weight: 2 },
  { prefecture: "広島", region: "中国・四国", latitude: 34.39, longitude: 132.46, weight: 3 },
  { prefecture: "山口", region: "中国・四国", latitude: 34.18, longitude: 131.47, weight: 1 },
  { prefecture: "徳島", region: "中国・四国", latitude: 34.07, longitude: 134.55, weight: 1 },
  { prefecture: "香川", region: "中国・四国", latitude: 34.34, longitude: 134.04, weight: 1 },
  { prefecture: "愛媛", region: "中国・四国", latitude: 33.84, longitude: 132.77, weight: 1 },
  { prefecture: "高知", region: "中国・四国", latitude: 33.56, longitude: 133.53, weight: 1 },
  { prefecture: "福岡", region: "九州・沖縄", latitude: 33.59, longitude: 130.4, weight: 5 },
  { prefecture: "佐賀", region: "九州・沖縄", latitude: 33.25, longitude: 130.3, weight: 1 },
  { prefecture: "長崎", region: "九州・沖縄", latitude: 32.75, longitude: 129.87, weight: 1 },
  { prefecture: "熊本", region: "九州・沖縄", latitude: 32.8, longitude: 130.71, weight: 2 },
  { prefecture: "大分", region: "九州・沖縄", latitude: 33.24, longitude: 131.61, weight: 1 },
  { prefecture: "宮崎", region: "九州・沖縄", latitude: 31.91, longitude: 131.42, weight: 1 },
  { prefecture: "鹿児島", region: "九州・沖縄", latitude: 31.6, longitude: 130.56, weight: 2 },
  { prefecture: "沖縄", region: "九州・沖縄", latitude: 26.21, longitude: 127.68, weight: 2 },
];

export const initialSites: Site[] = [
  {
    id: "S-001",
    name: "札幌中央",
    prefecture: "北海道",
    region: "北海道・東北",
    latitude: 43.06,
    longitude: 141.35,
    difficulty: "高",
    priority: "高",
    blackoutMonths: ["01", "02"],
  },
  {
    id: "S-002",
    name: "仙台東",
    prefecture: "宮城",
    region: "北海道・東北",
    latitude: 38.27,
    longitude: 140.87,
    difficulty: "中",
    priority: "中",
    blackoutMonths: ["12"],
  },
  {
    id: "S-003",
    name: "東京本社",
    prefecture: "東京",
    region: "関東",
    latitude: 35.68,
    longitude: 139.76,
    difficulty: "高",
    priority: "高",
    blackoutMonths: ["03"],
  },
  {
    id: "S-004",
    name: "横浜西",
    prefecture: "神奈川",
    region: "関東",
    latitude: 35.44,
    longitude: 139.64,
    difficulty: "中",
    priority: "高",
    blackoutMonths: [],
  },
  {
    id: "S-005",
    name: "名古屋北",
    prefecture: "愛知",
    region: "中部",
    latitude: 35.18,
    longitude: 136.9,
    difficulty: "低",
    priority: "中",
    blackoutMonths: ["08"],
  },
  {
    id: "S-006",
    name: "大阪南",
    prefecture: "大阪",
    region: "関西",
    latitude: 34.69,
    longitude: 135.5,
    difficulty: "中",
    priority: "低",
    blackoutMonths: ["04"],
  },
  {
    id: "S-007",
    name: "広島西",
    prefecture: "広島",
    region: "中国・四国",
    latitude: 34.39,
    longitude: 132.46,
    difficulty: "低",
    priority: "低",
    blackoutMonths: [],
  },
  {
    id: "S-008",
    name: "福岡天神",
    prefecture: "福岡",
    region: "九州・沖縄",
    latitude: 33.59,
    longitude: 130.4,
    difficulty: "高",
    priority: "中",
    blackoutMonths: ["07"],
  },
];

export function createSiteSet(siteSet: SiteSet): Site[] {
  if (siteSet === "sample") return initialSites;
  const count = siteSet === "scale-10" ? 10 : siteSet === "scale-100" ? 100 : siteSet === "scale-1000" ? 1000 : 3000;
  const weightedPrefectures = prefectureMasters.flatMap((master) => Array.from({ length: master.weight }, () => master));
  const compactPrefectures = ["北海道", "宮城", "東京", "神奈川", "愛知", "大阪", "広島", "福岡", "沖縄", "新潟"];

  return Array.from({ length: count }, (_, index) => {
    const master =
      siteSet === "scale-10"
        ? (prefectureMasters.find((item) => item.prefecture === compactPrefectures[index]) ?? prefectureMasters[0])
        : weightedPrefectures[(index * 17 + Math.floor(index / 5)) % weightedPrefectures.length];
    const difficultyIndex = index % 10;
    const priorityIndex = index % 12;
    const blackoutMonths =
      index % 7 === 0
        ? [monthOptions[index % monthOptions.length]]
        : index % 11 === 0
          ? [monthOptions[(index + 5) % monthOptions.length]]
          : [];

    return {
      id: `S-${String(index + 1).padStart(4, "0")}`,
      name: `${master.prefecture}拠点${String(index + 1).padStart(4, "0")}`,
      prefecture: master.prefecture,
      region: master.region,
      latitude: Number((master.latitude + ((index % 9) - 4) * 0.035).toFixed(4)),
      longitude: Number((master.longitude + ((index % 11) - 5) * 0.035).toFixed(4)),
      difficulty: difficultyIndex < 2 ? "高" : difficultyIndex < 6 ? "中" : "低",
      priority: priorityIndex < 3 ? "高" : priorityIndex < 8 ? "中" : "低",
      blackoutMonths,
    };
  });
}

export function getSiteSetLabel(siteSet: SiteSet) {
  return siteSetOptions.find((option) => option.value === siteSet)?.label ?? "未選択";
}
