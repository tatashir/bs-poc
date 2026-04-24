import type { CarrierLoad, CarrierOffice } from "@/lib/carrier-offices";
import type { GeneratedPlan, ProjectSetting, Region, Site, VendorCapacity } from "@/lib/scheduler";
import { getMonthRange } from "@/lib/scheduler";
import { regions } from "@/lib/site-sets";

export type PlanStatus = "Draft" | "Ready" | "Generated";

export type TeamMember = {
  id: string;
  name: string;
  role: "Owner" | "Admin" | "Member" | "Viewer";
  title: string;
};

export type UsageStats = {
  planLabel: string;
  simulationsUsed: number;
  simulationsLimit: number;
  sitesAnalyzed: number;
  sitesLimit: number;
  aiInsightsUsed: number;
  aiInsightsLimit: number;
  teamMembersUsed: number;
  teamMembersLimit: number;
};

export type AiSuggestionAction =
  | {
      type: "boost-region-capacity";
      region: Region;
      amount: number;
    }
  | {
      type: "boost-carrier-office";
      officeId: string;
      amount: number;
    }
  | {
      type: "raise-monthly-minimum";
      amount: number;
    };

export type AiSuggestion = {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  actionLabel?: string;
  action?: AiSuggestionAction;
};

export const demoTeamMembers: TeamMember[] = [
  { id: "TM-001", name: "Demo Admin", role: "Owner", title: "Platform Owner" },
  { id: "TM-002", name: "Network PM", role: "Admin", title: "Rollout Program Manager" },
  { id: "TM-003", name: "Carrier Coordinator", role: "Member", title: "Carrier Operations" },
  { id: "TM-004", name: "Viewer", role: "Viewer", title: "Executive Stakeholder" },
];

export function getPlanStatus(plan: GeneratedPlan | null, sites: Site[], months: string[]): PlanStatus {
  if (plan) return "Generated";
  if (sites.length > 0 && months.length > 0) return "Ready";
  return "Draft";
}

export function normalizeCapacities(
  capacities: VendorCapacity[],
  setting: ProjectSetting,
): VendorCapacity[] {
  const months = getMonthRange(setting.startMonth, setting.endMonth);
  const capacityByRegion = new Map<Region, number>();

  for (const region of regions) {
    const existing = capacities.find((capacity) => capacity.region === region && months.includes(capacity.yearMonth));
    const fallback = capacities.find((capacity) => capacity.region === region);
    capacityByRegion.set(region, existing?.maxCapacity ?? fallback?.maxCapacity ?? (region === "関東" ? 3 : 2));
  }

  return regions.flatMap((region) =>
    months.map((yearMonth) => {
      const current = capacities.find((capacity) => capacity.region === region && capacity.yearMonth === yearMonth);
      return {
        region,
        yearMonth,
        maxCapacity: current?.maxCapacity ?? capacityByRegion.get(region) ?? 2,
      };
    }),
  );
}

type InsightContext = {
  sites: Site[];
  setting: ProjectSetting;
  capacities: VendorCapacity[];
  carrierLoads: CarrierLoad[];
  carrierOffices: CarrierOffice[];
  plan: GeneratedPlan | null;
  warningCount: number;
  pilotCount: number;
  planStatus: PlanStatus;
};

export function buildAiSuggestions({
  sites,
  setting,
  capacities,
  carrierLoads,
  carrierOffices,
  plan,
  warningCount,
  pilotCount,
  planStatus,
}: InsightContext): AiSuggestion[] {
  const suggestions: AiSuggestion[] = [];
  const highDifficultySites = sites.filter((site) => site.difficulty === "高").length;
  const lateStageAssignments =
    plan?.assignments.filter((assignment) => {
      const month = Number(assignment.yearMonth.slice(5));
      return month >= 10;
    }).length ?? 0;
  const hokkaidoWinterCapacity = capacities
    .filter(
      (capacity) =>
        capacity.region === "北海道・東北" && (capacity.yearMonth.endsWith("-01") || capacity.yearMonth.endsWith("-02")),
    )
    .reduce((total, capacity) => total + capacity.maxCapacity, 0);
  const kantoLoads = carrierLoads
    .filter((load) => load.office.region === "関東")
    .sort((a, b) => b.loadRatio - a.loadRatio);
  const hotCarrierOffice = [...carrierLoads].sort((a, b) => b.loadRatio - a.loadRatio)[0];
  const regionWarnings = new Map<Region, number>();

  for (const assignment of plan?.assignments ?? []) {
    regionWarnings.set(assignment.region, (regionWarnings.get(assignment.region) ?? 0) + assignment.warnings.length);
  }

  if (setting.snowSeasonMonths.includes("01") || setting.snowSeasonMonths.includes("02")) {
    suggestions.push({
      id: "snow-readiness",
      title: "北海道・東北の前倒し余地",
      message: `北海道・東北エリアは降雪期制約により 1〜2月の柔軟性が低くなっています。現在の冬季キャパ合計は ${hokkaidoWinterCapacity} 件です。11月前倒しを検討してください。`,
      severity: "warning",
      actionLabel: "Apply action",
      action: { type: "boost-region-capacity", region: "北海道・東北", amount: 1 },
    });
  }

  if (kantoLoads[0] && kantoLoads[0].loadRatio >= 75) {
    suggestions.push({
      id: "kanto-capacity",
      title: "関東キャパの増強提案",
      message: `関東エリアの業者キャパが月次ピークに近づいています。特に ${kantoLoads[0].office.name} の負荷率は ${kantoLoads[0].loadRatio}% です。東京第2拠点相当の増強が有効です。`,
      severity: kantoLoads[0].loadRatio >= 100 ? "critical" : "warning",
      actionLabel: "Apply action",
      action: { type: "boost-carrier-office", officeId: kantoLoads[0].office.id, amount: 6 },
    });
  }

  if (highDifficultySites > 0 && lateStageAssignments >= Math.max(2, Math.ceil(highDifficultySites / 2))) {
    suggestions.push({
      id: "pilot-first",
      title: "高難易度拠点の先行着手",
      message: `高難易度拠点が後半月に集中しています。現在 ${lateStageAssignments} 件が 10月以降に入っているため、${pilotCount} 件のパイロット候補を先行実施してください。`,
      severity: "warning",
      actionLabel: "Apply action",
      action: { type: "raise-monthly-minimum", amount: 1 },
    });
  }

  if (warningCount > 0) {
    const topRiskRegion =
      [...regionWarnings.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "関東";
    suggestions.push({
      id: "risk-review",
      title: "リスクの集中エリア",
      message: `警告は合計 ${warningCount} 件です。${topRiskRegion} に警告が集まりやすいため、地域キャパと作業不可月の見直しを優先してください。`,
      severity: warningCount >= 10 ? "critical" : "warning",
    });
  }

  if (planStatus !== "Generated") {
    suggestions.push({
      id: "pre-run",
      title: "Pre-run checks",
      message: `現在の対象は ${sites.length} 拠点、業者拠点は ${carrierOffices.length} 件です。計画生成前に、月次下限 ${setting.monthlyMinimum} 件と月次上限 ${setting.monthlyMaximum} 件のバランスを確認してください。`,
      severity: "info",
    });
  }

  if (hotCarrierOffice && hotCarrierOffice.loadRatio < 75) {
    suggestions.push({
      id: "balanced-plan",
      title: "計画条件は安定傾向",
      message: `業者体制の最大負荷率は ${hotCarrierOffice.loadRatio}% で、現時点では大きな偏りは見られません。この条件はデモ用の基準案として扱えます。`,
      severity: "info",
    });
  }

  return suggestions.slice(0, 4);
}

export function buildUsageStats(args: {
  simulationsUsed: number;
  sitesAnalyzed: number;
  aiInsightsUsed: number;
  teamMembersUsed: number;
}): UsageStats {
  return {
    planLabel: "Pro Trial",
    simulationsUsed: args.simulationsUsed,
    simulationsLimit: 20,
    sitesAnalyzed: args.sitesAnalyzed,
    sitesLimit: 3000,
    aiInsightsUsed: args.aiInsightsUsed,
    aiInsightsLimit: 100,
    teamMembersUsed: args.teamMembersUsed,
    teamMembersLimit: 10,
  };
}
