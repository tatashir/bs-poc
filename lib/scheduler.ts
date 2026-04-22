export type Region = "北海道・東北" | "関東" | "中部" | "関西" | "中国・四国" | "九州・沖縄";

export type Site = {
  id: string;
  name: string;
  prefecture: string;
  region: Region;
  latitude: number;
  longitude: number;
  difficulty: "低" | "中" | "高";
  priority: "低" | "中" | "高";
  blackoutMonths: string[];
};

export type VendorCapacity = {
  region: Region;
  yearMonth: string;
  maxCapacity: number;
};

export type ProjectSetting = {
  startMonth: string;
  endMonth: string;
  monthlyMinimum: number;
  monthlyMaximum: number;
  snowSeasonMonths: string[];
  busySeasonMonths: string[];
};

export type Plan = {
  id: string;
  version: string;
  score: number;
  createdAt: string;
};

export type PlanAssignment = {
  siteId: string;
  yearMonth: string;
  region: Region;
  warnings: string[];
  reason: string;
};

export type GeneratedPlan = {
  plan: Plan;
  assignments: PlanAssignment[];
};

const difficultyWeight = {
  高: 3,
  中: 2,
  低: 1,
} as const;

const priorityWeight = {
  高: 3,
  中: 2,
  低: 1,
} as const;

export function getMonthRange(startMonth: string, endMonth: string): string[] {
  const [startYear, start] = startMonth.split("-").map(Number);
  const [endYear, end] = endMonth.split("-").map(Number);
  const months: string[] = [];
  const cursor = new Date(startYear, start - 1, 1);
  const last = new Date(endYear, end - 1, 1);

  while (cursor <= last) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

export function generatePlan(
  sites: Site[],
  capacities: VendorCapacity[],
  setting: ProjectSetting,
): GeneratedPlan {
  const months = getMonthRange(setting.startMonth, setting.endMonth);
  if (months.length === 0) {
    return {
      plan: {
        id: `plan-${Date.now()}`,
        version: "0.1",
        score: 0,
        createdAt: new Date().toISOString(),
      },
      assignments: [],
    };
  }

  const assignedCounts = new Map<string, number>();
  const capacityByRegionMonth = new Map<string, number>();

  for (const capacity of capacities) {
    capacityByRegionMonth.set(`${capacity.region}:${capacity.yearMonth}`, capacity.maxCapacity);
  }

  const sortedSites = [...sites].sort((a, b) => {
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return difficultyWeight[b.difficulty] - difficultyWeight[a.difficulty];
  });

  const assignments = sortedSites.map((site) => {
    const candidates = months
      .map((month) => {
        const totalCount = assignedCounts.get(month) ?? 0;
        const regionKey = `${site.region}:${month}`;
        const regionCount = assignedCounts.get(regionKey) ?? 0;
        const maxRegionCapacity = capacityByRegionMonth.get(regionKey) ?? setting.monthlyMaximum;
        const isBlackout = site.blackoutMonths.includes(month.slice(5));
        const isSnow = setting.snowSeasonMonths.includes(month.slice(5));
        const isBusy = setting.busySeasonMonths.includes(month.slice(5));
        const isOverMonthly = totalCount >= setting.monthlyMaximum;
        const isOverRegion = regionCount >= maxRegionCapacity;

        let penalty = totalCount * 4 + regionCount * 3;
        if (isBlackout) penalty += 1000;
        if (isOverMonthly) penalty += 500;
        if (isOverRegion) penalty += 500;
        if (isSnow && site.region === "北海道・東北") penalty += 80;
        if (isBusy) penalty += 40;
        if (site.difficulty === "高" && (isSnow || isBusy)) penalty += 30;

        return { month, penalty, isBlackout, isSnow, isBusy, isOverMonthly, isOverRegion };
      })
      .sort((a, b) => a.penalty - b.penalty);

    const selected = candidates[0];
    const monthCount = assignedCounts.get(selected.month) ?? 0;
    const regionKey = `${site.region}:${selected.month}`;
    const regionCount = assignedCounts.get(regionKey) ?? 0;
    assignedCounts.set(selected.month, monthCount + 1);
    assignedCounts.set(regionKey, regionCount + 1);

    const warnings: string[] = [];
    if (selected.isBlackout) warnings.push("作業不可月に割当");
    if (selected.isSnow) warnings.push("降雪期");
    if (selected.isBusy) warnings.push("繁忙期");
    if (selected.isOverMonthly) warnings.push("月次上限超過");
    if (selected.isOverRegion) warnings.push("地域キャパ超過");

    const reasonParts = [
      `優先度${site.priority}`,
      `難易度${site.difficulty}`,
      `${site.region}の月次負荷が相対的に低い月を選択`,
    ];
    if (warnings.length > 0) reasonParts.push(`注意: ${warnings.join("、")}`);

    return {
      siteId: site.id,
      yearMonth: selected.month,
      region: site.region,
      warnings,
      reason: reasonParts.join("。"),
    };
  });

  const warningCount = assignments.reduce((total, assignment) => total + assignment.warnings.length, 0);
  const score = Math.max(0, 100 - warningCount * 7);

  return {
    plan: {
      id: `plan-${Date.now()}`,
      version: "0.1",
      score,
      createdAt: new Date().toISOString(),
    },
    assignments,
  };
}
