export type Region =
  | "北海道・東北"
  | "関東"
  | "中部"
  | "関西"
  | "中国・四国"
  | "九州・沖縄";

export type RolloutBlock =
  | "北海道"
  | "東北"
  | "関東"
  | "中部"
  | "関西"
  | "中国"
  | "四国"
  | "九州・沖縄";

export type SiteType = "販売店" | "営業所" | "事務所";

export type SiteRecord = {
  id: string;
  name: string;
  prefecture: string;
  region: Region;
  block: RolloutBlock;
  type: SiteType;
  lat: number;
  lng: number;
  districtHqId: string;
};

export type DistrictHeadquarters = {
  id: string;
  name: string;
  prefecture: string;
  region: Region;
  block: RolloutBlock;
  lat: number;
  lng: number;
  managedSiteIds: string[];
  managedSiteCount: number;
};

export type PrefectureMaster = {
  prefecture: string;
  region: Region;
  block: RolloutBlock;
  lat: number;
  lng: number;
  weight: number;
  districtHqCount: number;
};

export type SimulationDataset = {
  sites: SiteRecord[];
  districtHqs: DistrictHeadquarters[];
  prefectures: PrefectureMaster[];
};

export type ScenarioPreset = "concurrent" | "sequential" | "focused";

export type ScenarioConfig = {
  id: string;
  name: string;
  preset: ScenarioPreset;
  startMonth: string;
  maxDistrictsPerMonth: number;
  monthlySiteSoftCap: number;
  carryOverMonths: number;
};

export type ScenarioSummary = {
  durationMonths: number;
  totalSites: number;
  totalDistricts: number;
  peakSitesPerMonth: number;
  peakDistrictsPerMonth: number;
  peakSupportLoad: number;
  averageSupportLoad: number;
  maxActiveBlocks: number;
  startMonth: string;
  endMonth: string;
};

export type DistrictPlan = {
  districtHqId: string;
  districtHqName: string;
  prefecture: string;
  region: Region;
  block: RolloutBlock;
  siteCount: number;
  monthIndex: number;
  yearMonth: string;
};

export type MonthlyScenarioPoint = {
  monthIndex: number;
  yearMonth: string;
  districtCount: number;
  siteCount: number;
  cumulativeSites: number;
  cumulativeDistricts: number;
  activeBlocks: number;
  supportLoad: number;
  managementLoad: number;
};

export type ScenarioResult = {
  config: ScenarioConfig;
  districtPlans: DistrictPlan[];
  monthlyPoints: MonthlyScenarioPoint[];
  summary: ScenarioSummary;
};
