import { simulationDataset } from "@/lib/simulator/dummy-data";
import type {
  DistrictHeadquarters,
  DistrictPlan,
  MonthlyScenarioPoint,
  RolloutBlock,
  ScenarioConfig,
  ScenarioPreset,
  ScenarioResult,
  ScenarioSummary,
  SimulationDataset,
} from "@/lib/simulator/types";

const southToNorthBlocks: RolloutBlock[] = [
  "九州・沖縄",
  "四国",
  "中国",
  "関西",
  "中部",
  "関東",
  "東北",
  "北海道",
];

const concurrentBlocks: RolloutBlock[] = [
  "北海道",
  "東北",
  "関東",
  "中部",
  "関西",
  "中国",
  "四国",
  "九州・沖縄",
];

const focusedGroups: RolloutBlock[][] = [
  ["九州・沖縄", "四国", "中国"],
  ["関西", "中部"],
  ["関東"],
  ["東北", "北海道"],
];

export const scenarioPresetLabels: Record<ScenarioPreset, string> = {
  concurrent: "A案: 全国同時多発型",
  sequential: "B案: 南から順次展開型",
  focused: "C案: 地方ブロック集中型",
};

export const scenarioPresetDescriptions: Record<ScenarioPreset, string> = {
  concurrent: "各地方で同時に少しずつ進め、期間短縮を優先する。",
  sequential: "南から北へ順次進め、窓口と管理対象を絞る。",
  focused: "ブロック単位で集中展開し、現場対応と問合せをまとめる。",
};

function shiftYearMonth(startMonth: string, offset: number) {
  const [year, month] = startMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function sortDistrictsByWeight(districts: DistrictHeadquarters[]) {
  return [...districts].sort((left, right) => {
    if (right.managedSiteCount !== left.managedSiteCount) {
      return right.managedSiteCount - left.managedSiteCount;
    }
    return left.id.localeCompare(right.id, "ja");
  });
}

function interleaveByBlocks(
  districts: DistrictHeadquarters[],
  blocks: RolloutBlock[],
) {
  const grouped = new Map<RolloutBlock, DistrictHeadquarters[]>();
  for (const block of blocks) {
    grouped.set(
      block,
      sortDistrictsByWeight(districts.filter((district) => district.block === block)),
    );
  }

  const ordered: DistrictHeadquarters[] = [];
  let hasItems = true;
  while (hasItems) {
    hasItems = false;
    for (const block of blocks) {
      const queue = grouped.get(block) ?? [];
      const next = queue.shift();
      if (!next) continue;
      ordered.push(next);
      hasItems = true;
    }
  }
  return ordered;
}

function focusedOrder(districts: DistrictHeadquarters[]) {
  const ordered: DistrictHeadquarters[] = [];
  for (const group of focusedGroups) {
    ordered.push(...interleaveByBlocks(districts, group));
  }
  return ordered;
}

function buildDistrictOrder(
  districts: DistrictHeadquarters[],
  preset: ScenarioPreset,
) {
  if (preset === "concurrent") {
    return interleaveByBlocks(districts, concurrentBlocks);
  }
  if (preset === "sequential") {
    return southToNorthBlocks.flatMap((block) =>
      sortDistrictsByWeight(districts.filter((district) => district.block === block)),
    );
  }
  return focusedOrder(districts);
}

function roundMetric(value: number) {
  return Number(value.toFixed(1));
}

function buildMonthlyPoints(
  plans: DistrictPlan[],
  config: ScenarioConfig,
) {
  const totalMonths = Math.max(0, ...plans.map((plan) => plan.monthIndex)) + 1;
  const monthlyPoints: MonthlyScenarioPoint[] = [];

  for (let monthIndex = 0; monthIndex < totalMonths; monthIndex += 1) {
    const items = plans.filter((plan) => plan.monthIndex === monthIndex);
    const siteCount = items.reduce((sum, item) => sum + item.siteCount, 0);
    const districtCount = items.length;
    const activeBlocks = new Set(items.map((item) => item.block)).size;
    const carryOverDistricts = plans.filter(
      (plan) =>
        plan.monthIndex < monthIndex &&
        plan.monthIndex >= monthIndex - config.carryOverMonths,
    ).length;
    const cumulativeSites =
      (monthlyPoints[monthIndex - 1]?.cumulativeSites ?? 0) + siteCount;
    const cumulativeDistricts =
      (monthlyPoints[monthIndex - 1]?.cumulativeDistricts ?? 0) + districtCount;
    const supportLoad =
      siteCount * 0.11 +
      districtCount * 4.2 +
      activeBlocks * 8.5 +
      carryOverDistricts * 1.8;
    const managementLoad = districtCount * 5.5 + activeBlocks * 11.5;

    monthlyPoints.push({
      monthIndex,
      yearMonth: shiftYearMonth(config.startMonth, monthIndex),
      districtCount,
      siteCount,
      cumulativeSites,
      cumulativeDistricts,
      activeBlocks,
      supportLoad: roundMetric(supportLoad),
      managementLoad: roundMetric(managementLoad),
    });
  }

  return monthlyPoints;
}

function buildSummary(
  plans: DistrictPlan[],
  monthlyPoints: MonthlyScenarioPoint[],
): ScenarioSummary {
  const totalSites = plans.reduce((sum, plan) => sum + plan.siteCount, 0);
  const peakSitesPerMonth = Math.max(0, ...monthlyPoints.map((point) => point.siteCount));
  const peakDistrictsPerMonth = Math.max(
    0,
    ...monthlyPoints.map((point) => point.districtCount),
  );
  const peakSupportLoad = Math.max(
    0,
    ...monthlyPoints.map((point) => point.supportLoad),
  );
  const averageSupportLoad =
    monthlyPoints.length === 0
      ? 0
      : roundMetric(
          monthlyPoints.reduce((sum, point) => sum + point.supportLoad, 0) /
            monthlyPoints.length,
        );
  const maxActiveBlocks = Math.max(
    0,
    ...monthlyPoints.map((point) => point.activeBlocks),
  );

  return {
    durationMonths: monthlyPoints.length,
    totalSites,
    totalDistricts: plans.length,
    peakSitesPerMonth,
    peakDistrictsPerMonth,
    peakSupportLoad,
    averageSupportLoad,
    maxActiveBlocks,
    startMonth: monthlyPoints[0]?.yearMonth ?? "",
    endMonth: monthlyPoints[monthlyPoints.length - 1]?.yearMonth ?? "",
  };
}

export function simulateScenario(
  config: ScenarioConfig,
  dataset: SimulationDataset = simulationDataset,
): ScenarioResult {
  const orderedDistricts = buildDistrictOrder(dataset.districtHqs, config.preset);
  const districtPlans: DistrictPlan[] = [];
  let monthIndex = 0;
  let cursor = 0;

  while (cursor < orderedDistricts.length) {
    let monthSiteCount = 0;
    let monthDistrictCount = 0;

    while (
      cursor < orderedDistricts.length &&
      monthDistrictCount < config.maxDistrictsPerMonth
    ) {
      const district = orderedDistricts[cursor];
      const wouldExceedCap =
        monthSiteCount + district.managedSiteCount > config.monthlySiteSoftCap;
      if (monthDistrictCount > 0 && wouldExceedCap) break;

      districtPlans.push({
        districtHqId: district.id,
        districtHqName: district.name,
        prefecture: district.prefecture,
        region: district.region,
        block: district.block,
        siteCount: district.managedSiteCount,
        monthIndex,
        yearMonth: shiftYearMonth(config.startMonth, monthIndex),
      });
      monthSiteCount += district.managedSiteCount;
      monthDistrictCount += 1;
      cursor += 1;
    }

    monthIndex += 1;
  }

  const monthlyPoints = buildMonthlyPoints(districtPlans, config);
  return {
    config,
    districtPlans,
    monthlyPoints,
    summary: buildSummary(districtPlans, monthlyPoints),
  };
}

export function buildDefaultScenarioConfigs(): ScenarioConfig[] {
  return [
    {
      id: "scenario-a",
      name: "A案: 全国同時多発型",
      preset: "concurrent",
      startMonth: "2026-04",
      maxDistrictsPerMonth: 8,
      monthlySiteSoftCap: 130,
      carryOverMonths: 2,
    },
    {
      id: "scenario-b",
      name: "B案: 南から順次展開型",
      preset: "sequential",
      startMonth: "2026-04",
      maxDistrictsPerMonth: 5,
      monthlySiteSoftCap: 90,
      carryOverMonths: 1,
    },
    {
      id: "scenario-c",
      name: "C案: 地方ブロック集中型",
      preset: "focused",
      startMonth: "2026-04",
      maxDistrictsPerMonth: 7,
      monthlySiteSoftCap: 110,
      carryOverMonths: 1,
    },
  ];
}
