"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SiteDistributionMap } from "@/components/SiteDistributionMap";
import {
  generatePlan,
  getMonthRange,
  type GeneratedPlan,
  type ProjectSetting,
  type Region,
  type Site,
  type VendorCapacity,
} from "@/lib/scheduler";
import {
  createSiteSet,
  getSiteSetLabel,
  initialSites,
  monthOptions,
  regions,
  type SiteSet,
  siteSetOptions,
} from "@/lib/site-sets";

const storageKey = "nw-rollout-planner-poc:v3";

type Screen = "dashboard" | "siteSets" | "settings" | "run" | "results";

type PlanRunMetadata = {
  id: string;
  requestedAt: string;
  siteSetLabel: string;
  sitesCount: number;
  period: string;
  monthlyRange: string;
  capacityCount: number;
  process: string[];
};

type SavedState = {
  isSignedIn: boolean;
  siteSet: SiteSet;
  sites: Site[];
  setting: ProjectSetting;
  capacities: VendorCapacity[];
  plan: GeneratedPlan | null;
  planRun: PlanRunMetadata | null;
};

const initialSetting: ProjectSetting = {
  startMonth: "2026-04",
  endMonth: "2026-12",
  monthlyMinimum: 2,
  monthlyMaximum: 4,
  snowSeasonMonths: ["01", "02", "12"],
  busySeasonMonths: ["03", "04", "09"],
};

function createInitialCapacities(setting: ProjectSetting): VendorCapacity[] {
  return regions.flatMap((region) =>
    getMonthRange(setting.startMonth, setting.endMonth).map((yearMonth) => ({
      region,
      yearMonth,
      maxCapacity: region === "関東" ? 3 : 2,
    })),
  );
}

function isSavedState(value: unknown): value is SavedState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedState>;
  return (
    typeof candidate.isSignedIn === "boolean" &&
    typeof candidate.siteSet === "string" &&
    Array.isArray(candidate.sites) &&
    Boolean(candidate.setting) &&
    Array.isArray(candidate.capacities)
  );
}

function createPlanRunMetadata(
  siteSet: SiteSet,
  sites: Site[],
  capacities: VendorCapacity[],
  setting: ProjectSetting,
): PlanRunMetadata {
  const months = getMonthRange(setting.startMonth, setting.endMonth);
  const warningTargets = sites.filter((site) => site.blackoutMonths.length > 0).length;
  const siteSetLabel = getSiteSetLabel(siteSet);

  return {
    id: `RUN-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`,
    requestedAt: new Date().toISOString(),
    siteSetLabel,
    sitesCount: sites.length,
    period: `${setting.startMonth} - ${setting.endMonth}`,
    monthlyRange: `${setting.monthlyMinimum} - ${setting.monthlyMaximum}件/月`,
    capacityCount: capacities.length,
    process: [
      `${siteSetLabel}から${sites.length}拠点を読み込み`,
      `${months.length}か月の計画期間を生成`,
      `${regions.length}地域、${capacities.length}件の施工キャパを集計`,
      `${warningTargets}拠点の作業不可月を制約として反映`,
      "優先度と難易度で拠点を並び替え",
      "月次負荷、地域キャパ、季節制約のペナルティを評価",
      "最小ペナルティ月へ割当し、警告とreasonを生成",
    ],
  };
}

function Shell({
  current,
  setCurrent,
  children,
  onReset,
}: {
  current: Screen;
  setCurrent: (screen: Screen) => void;
  children: React.ReactNode;
  onReset: () => void;
}) {
  const navItems: { key: Screen; label: string; description: string }[] = [
    { key: "dashboard", label: "ダッシュボード", description: "全体状況" },
    { key: "siteSets", label: "拠点セット定義", description: "規模と分布" },
    { key: "settings", label: "計画メタデータ設定", description: "期間と制約" },
    { key: "run", label: "計画作成実行", description: "入力確認と生成" },
    { key: "results", label: "結果", description: "割当と警告" },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-r border-sky-100 bg-white">
          <div className="flex h-full flex-col p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-cyan-500 text-base font-black text-white shadow-sm shadow-cyan-200">
                RP
              </div>
              <div>
                <p className="text-sm font-bold text-cyan-700">NW展開計画管理</p>
                <p className="text-xs font-semibold text-slate-500">Rollout Planner</p>
              </div>
            </div>

            <nav className="mt-7 grid gap-2" aria-label="画面ナビゲーション">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCurrent(item.key)}
                  className={`rounded-md px-3 py-3 text-left transition ${
                    current === item.key ? "bg-cyan-50 text-cyan-800 shadow-sm" : "text-slate-600 hover:bg-sky-50"
                  }`}
                >
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className="mt-1 block text-xs font-semibold">{item.description}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto rounded-md bg-sky-50 p-4">
              <p className="text-xs font-bold text-slate-500">Storage</p>
              <p className="mt-1 text-sm font-bold text-slate-950">localStorage保存中</p>
              <button
                type="button"
                onClick={onReset}
                className="mt-3 h-9 w-full rounded-md border border-orange-200 bg-white px-3 text-sm font-bold text-orange-700 hover:bg-orange-50"
              >
                保存データをリセット
              </button>
            </div>
          </div>
        </aside>
        <section className="min-w-0">
          <header className="border-b border-sky-100 bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-bold text-cyan-700">PoC Workspace</p>
                <h1 className="mt-1 text-2xl font-black text-slate-950">全国NW更改 展開計画</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800">
                  画面遷移プロトタイプ
                </span>
                <span className="rounded-md border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700">
                  DB未接続
                </span>
              </div>
            </div>
          </header>
          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </section>
      </div>
    </main>
  );
}

export default function Home() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [storageReady, setStorageReady] = useState(false);
  const [siteSet, setSiteSet] = useState<SiteSet>("sample");
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [setting, setSetting] = useState<ProjectSetting>(initialSetting);
  const [capacities, setCapacities] = useState<VendorCapacity[]>(() => createInitialCapacities(initialSetting));
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [planRun, setPlanRun] = useState<PlanRunMetadata | null>(null);
  const [resultRegionFilter, setResultRegionFilter] = useState<"all" | Region>("all");
  const [warningOnly, setWarningOnly] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        setStorageReady(true);
        return;
      }

      const parsed: unknown = JSON.parse(saved);
      if (!isSavedState(parsed)) {
        setStorageReady(true);
        return;
      }

      setIsSignedIn(parsed.isSignedIn);
      setSiteSet(parsed.siteSet);
      setSites(parsed.sites);
      setSetting(parsed.setting);
      setCapacities(parsed.capacities);
      setPlan(parsed.plan);
      setPlanRun(parsed.planRun);
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const value: SavedState = {
      isSignedIn,
      siteSet,
      sites,
      setting,
      capacities,
      plan,
      planRun,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, [capacities, isSignedIn, plan, planRun, setting, siteSet, sites, storageReady]);

  const months = useMemo(() => getMonthRange(setting.startMonth, setting.endMonth), [setting]);
  const visibleSites = useMemo(() => sites.slice(0, 100), [sites]);
  const hiddenSiteCount = Math.max(0, sites.length - visibleSites.length);
  const selectedSiteSetLabel = getSiteSetLabel(siteSet);

  const monthlySummary = useMemo(() => {
    return months.map((month) => ({
      month,
      count: plan?.assignments.filter((assignment) => assignment.yearMonth === month).length ?? 0,
    }));
  }, [months, plan]);

  const regionSummary = useMemo(() => {
    return regions.map((region) => {
      const total = sites.filter((site) => site.region === region).length;
      const planned = plan?.assignments.filter((assignment) => assignment.region === region).length ?? 0;
      return {
        region,
        total,
        planned,
        rate: total === 0 ? 0 : Math.round((planned / total) * 100),
      };
    });
  }, [plan, sites]);

  const filteredAssignments = useMemo(() => {
    const assignments = plan?.assignments ?? [];
    return assignments.filter((assignment) => {
      const regionMatched = resultRegionFilter === "all" || assignment.region === resultRegionFilter;
      const warningMatched = !warningOnly || assignment.warnings.length > 0;
      return regionMatched && warningMatched;
    });
  }, [plan, resultRegionFilter, warningOnly]);

  const warningCount = plan?.assignments.reduce((total, assignment) => total + assignment.warnings.length, 0) ?? 0;
  const monthlyPeak = monthlySummary.reduce((peak, item) => Math.max(peak, item.count), 0);

  function toggleMonth(target: "snowSeasonMonths" | "busySeasonMonths", month: string) {
    setSetting((current) => ({
      ...current,
      [target]: current[target].includes(month)
        ? current[target].filter((item) => item !== month)
        : [...current[target], month],
    }));
  }

  function applySiteSet(nextSiteSet: SiteSet) {
    const nextSites = createSiteSet(nextSiteSet);
    setSiteSet(nextSiteSet);
    setSites(nextSites);
    setPlan(null);
    setPlanRun(null);
  }

  function updateCapacity(region: Region, maxCapacity: number) {
    setCapacities((current) => {
      const next = current.filter((capacity) => capacity.region !== region);
      return [
        ...next,
        ...months.map((yearMonth) => ({
          region,
          yearMonth,
          maxCapacity,
        })),
      ];
    });
  }

  function runPlanner() {
    const nextPlan = generatePlan(sites, capacities, setting);
    const nextPlanRun = createPlanRunMetadata(siteSet, sites, capacities, setting);
    setPlan(nextPlan);
    setPlanRun(nextPlanRun);
    setCurrentScreen("results");
  }

  function resetStorage() {
    window.localStorage.removeItem(storageKey);
    setIsSignedIn(false);
    setCurrentScreen("dashboard");
    setSiteSet("sample");
    setSites(initialSites);
    setSetting(initialSetting);
    setCapacities(createInitialCapacities(initialSetting));
    setPlan(null);
    setPlanRun(null);
  }

  if (!isSignedIn) {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-4 py-10">
        <section className="w-full max-w-[420px]">
          <div className="mb-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-md bg-cyan-500 text-xl font-black text-white shadow-sm shadow-cyan-200">
              RP
            </div>
            <h1 className="mt-5 text-2xl font-black text-slate-950">サインイン</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">NW展開計画管理PoCへログインします</p>
          </div>

          <div className="rounded-md border border-sky-100 bg-white p-6 shadow-sm">
            <div className="grid gap-4">
              <label className="grid gap-1 text-sm font-bold text-slate-700">
                メールアドレス
                <input
                  type="email"
                  defaultValue="planner@example.com"
                  className="h-11 rounded-md border border-sky-100 px-3 font-normal text-slate-950 shadow-sm"
                />
              </label>
              <label className="grid gap-1 text-sm font-bold text-slate-700">
                パスワード
                <input
                  type="password"
                  defaultValue="password"
                  className="h-11 rounded-md border border-sky-100 px-3 font-normal text-slate-950 shadow-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input type="checkbox" defaultChecked className="h-4 w-4" />
                サインイン状態を保持する
              </label>
              <button
                type="button"
                onClick={() => setIsSignedIn(true)}
                className="h-11 rounded-md bg-cyan-500 px-4 text-sm font-black text-white shadow-sm shadow-cyan-200 hover:bg-cyan-600"
              >
                サインイン
              </button>
            </div>
            <div className="mt-5 text-center text-sm">
              <button type="button" className="font-bold text-cyan-700">
                パスワードを忘れた場合はこちら
              </button>
            </div>
            <p className="mt-4 rounded-md bg-orange-50 p-3 text-xs leading-5 text-orange-700">
              パスワードを5回間違えるとアカウントがロックされます。
            </p>
          </div>

          <div className="mt-8 border-t border-sky-100 pt-5 text-center text-xs font-semibold text-slate-500">
            <button type="button" className="mx-2 hover:text-cyan-700">
              プライバシーポリシー
            </button>
            <button type="button" className="mx-2 hover:text-cyan-700">
              利用規約
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <Shell current={currentScreen} setCurrent={setCurrentScreen} onReset={resetStorage}>
      {currentScreen === "dashboard" && (
        <section className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["拠点セット", selectedSiteSetLabel],
              ["対象拠点", `${sites.length}拠点`],
              ["最新Score", plan ? `${plan.plan.score}` : "-"],
              ["警告件数", `${warningCount}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <SiteDistributionMap sites={sites} />
            <div className="grid content-start gap-4">
              <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">次の操作</h2>
                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen("siteSets")}
                    className="h-10 rounded-md bg-cyan-500 px-4 text-sm font-bold text-white hover:bg-cyan-600"
                  >
                    拠点セットを確認
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen("run")}
                    className="h-10 rounded-md border border-sky-100 bg-white px-4 text-sm font-bold text-cyan-700 hover:bg-sky-50"
                  >
                    計画作成へ進む
                  </button>
                </div>
              </div>
              <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">最新計画</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Run ID</dt>
                    <dd className="font-bold text-slate-950">{planRun?.id ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">月次ピーク</dt>
                    <dd className="font-bold text-slate-950">{monthlyPeak ? `${monthlyPeak}件` : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">生成日時</dt>
                    <dd className="font-bold text-slate-950">
                      {planRun ? new Date(planRun.requestedAt).toLocaleString("ja-JP") : "-"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>
      )}

      {currentScreen === "siteSets" && (
        <section className="grid gap-5">
          <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">拠点セット定義</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">PoCでは規模別の疑似データを選択します。</p>
              <div className="mt-4 grid gap-3">
                {siteSetOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => applySiteSet(option.value)}
                    className={`rounded-md border p-3 text-left transition ${
                      siteSet === option.value
                        ? "border-cyan-500 bg-cyan-50 shadow-sm shadow-cyan-100"
                        : "border-sky-100 bg-white hover:bg-sky-50"
                    }`}
                  >
                    <span className="block text-sm font-black text-slate-950">{option.label}</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>
            <SiteDistributionMap sites={sites} />
          </div>
          <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">拠点群プレビュー</h2>
                <p className="mt-1 text-sm text-slate-500">先頭100件を表示</p>
              </div>
              <span className="rounded-md bg-cyan-50 px-3 py-1 text-sm font-bold text-cyan-700">{sites.length}拠点</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-sky-100 text-slate-500">
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2 pr-3">拠点名</th>
                    <th className="py-2 pr-3">都道府県</th>
                    <th className="py-2 pr-3">地域</th>
                    <th className="py-2 pr-3">難易度</th>
                    <th className="py-2 pr-3">優先度</th>
                    <th className="py-2 pr-3">作業不可月</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSites.map((site) => (
                    <tr key={site.id} className="border-b border-sky-50 hover:bg-sky-50/60">
                      <td className="py-3 pr-3 font-bold text-cyan-700">{site.id}</td>
                      <td className="py-3 pr-3 text-slate-950">{site.name}</td>
                      <td className="py-3 pr-3">{site.prefecture}</td>
                      <td className="py-3 pr-3">{site.region}</td>
                      <td className="py-3 pr-3">{site.difficulty}</td>
                      <td className="py-3 pr-3">{site.priority}</td>
                      <td className="py-3 pr-3">{site.blackoutMonths.length ? site.blackoutMonths.join(", ") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hiddenSiteCount > 0 && (
              <p className="mt-3 text-sm font-semibold text-slate-500">
                ほか {hiddenSiteCount} 拠点は計画生成には含め、表では省略しています。
              </p>
            )}
          </div>
        </section>
      )}

      {currentScreen === "settings" && (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">計画メタデータ設定</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                開始月
                <input
                  type="month"
                  value={setting.startMonth}
                  onChange={(event) => setSetting((current) => ({ ...current, startMonth: event.target.value }))}
                  className="h-10 rounded-md border border-sky-100 px-3 font-normal text-slate-950 shadow-sm"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                終了月
                <input
                  type="month"
                  value={setting.endMonth}
                  onChange={(event) => setSetting((current) => ({ ...current, endMonth: event.target.value }))}
                  className="h-10 rounded-md border border-sky-100 px-3 font-normal text-slate-950 shadow-sm"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                月次下限
                <input
                  type="number"
                  min={0}
                  value={setting.monthlyMinimum}
                  onChange={(event) => setSetting((current) => ({ ...current, monthlyMinimum: Number(event.target.value) }))}
                  className="h-10 rounded-md border border-sky-100 px-3 font-normal text-slate-950 shadow-sm"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                月次上限
                <input
                  type="number"
                  min={1}
                  value={setting.monthlyMaximum}
                  onChange={(event) => setSetting((current) => ({ ...current, monthlyMaximum: Number(event.target.value) }))}
                  className="h-10 rounded-md border border-sky-100 px-3 font-normal text-slate-950 shadow-sm"
                />
              </label>
            </div>
          </div>

          <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">季節制約</h2>
            <div className="mt-4 grid gap-4">
              {[
                ["snowSeasonMonths", "降雪期"],
                ["busySeasonMonths", "繁忙期"],
              ].map(([key, label]) => (
                <fieldset key={key}>
                  <legend className="text-sm font-semibold text-slate-700">{label}</legend>
                  <div className="mt-2 grid grid-cols-6 gap-2">
                    {monthOptions.map((month) => {
                      const selected = setting[key as "snowSeasonMonths" | "busySeasonMonths"].includes(month);
                      return (
                        <button
                          key={month}
                          type="button"
                          onClick={() => toggleMonth(key as "snowSeasonMonths" | "busySeasonMonths", month)}
                          className={`h-9 rounded-md border text-sm font-semibold ${
                            selected
                              ? key === "snowSeasonMonths"
                                ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                                : "border-amber-700 bg-amber-50 text-amber-800"
                              : "border-sky-100 bg-white text-slate-700 hover:bg-sky-50"
                          }`}
                        >
                          {month}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-950">地域別施工キャパ</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {regions.map((region) => {
                const value =
                  capacities.find((capacity) => capacity.region === region && capacity.yearMonth === months[0])?.maxCapacity ?? 2;
                return (
                  <label key={region} className="grid gap-1 text-sm font-semibold text-slate-700">
                    {region}
                    <input
                      type="number"
                      min={1}
                      value={value}
                      onChange={(event) => updateCapacity(region, Number(event.target.value))}
                      className="h-10 rounded-md border border-sky-100 px-3 font-normal text-slate-950 shadow-sm"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {currentScreen === "run" && (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">計画作成実行</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ["拠点セット", selectedSiteSetLabel],
                ["対象拠点数", `${sites.length}拠点`],
                ["計画期間", `${setting.startMonth} - ${setting.endMonth}`],
                ["月次件数", `${setting.monthlyMinimum} - ${setting.monthlyMaximum}件/月`],
                ["降雪期", setting.snowSeasonMonths.join(", ") || "-"],
                ["繁忙期", setting.busySeasonMonths.join(", ") || "-"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-sky-50 p-4">
                  <p className="text-xs font-bold text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={runPlanner}
              className="mt-6 h-11 rounded-md bg-cyan-500 px-5 text-sm font-black text-white shadow-sm shadow-cyan-200 hover:bg-cyan-600"
            >
              この条件で計画生成
            </button>
          </div>

          <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">生成プロセス</h2>
            <ol className="mt-4 grid gap-3">
              {createPlanRunMetadata(siteSet, sites, capacities, setting).process.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-cyan-50 text-xs font-black text-cyan-700">
                    {index + 1}
                  </span>
                  <span className="font-semibold leading-6 text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {currentScreen === "results" && (
        <section className="grid gap-5">
          <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">Plan Metadata</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Run ID</dt>
                  <dd className="font-bold text-slate-950">{planRun?.id ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Score</dt>
                  <dd className="text-3xl font-black text-cyan-700">{plan?.plan.score ?? "-"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">拠点セット</dt>
                  <dd className="font-bold text-slate-950">{planRun?.siteSetLabel ?? selectedSiteSetLabel}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">生成日時</dt>
                  <dd className="font-bold text-slate-950">
                    {planRun ? new Date(planRun.requestedAt).toLocaleString("ja-JP") : "-"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">月次件数</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="拠点数" fill="#21bed6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <SiteDistributionMap sites={sites} />
            <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">生成プロセス</h2>
              <ol className="mt-4 grid gap-3">
                {(planRun?.process ?? []).map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-cyan-50 text-xs font-black text-cyan-700">
                      {index + 1}
                    </span>
                    <span className="font-semibold leading-6 text-slate-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <h2 className="text-lg font-bold text-slate-950">割当結果</h2>
              <div className="flex flex-wrap gap-2">
                <select
                  value={resultRegionFilter}
                  onChange={(event) => setResultRegionFilter(event.target.value as "all" | Region)}
                  className="h-10 rounded-md border border-sky-100 px-3 text-sm font-bold text-slate-700 shadow-sm"
                >
                  <option value="all">全地域</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setWarningOnly((current) => !current)}
                  className={`h-10 rounded-md border px-3 text-sm font-bold ${
                    warningOnly
                      ? "border-orange-300 bg-orange-50 text-orange-700"
                      : "border-sky-100 bg-white text-slate-700 hover:bg-sky-50"
                  }`}
                >
                  警告ありのみ
                </button>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-sky-100 text-slate-500">
                    <th className="py-2 pr-3">拠点</th>
                    <th className="py-2 pr-3">月</th>
                    <th className="py-2 pr-3">地域</th>
                    <th className="py-2 pr-3">警告</th>
                    <th className="py-2 pr-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.slice(0, 250).map((assignment) => {
                    const site = sites.find((item) => item.id === assignment.siteId);
                    return (
                      <tr key={assignment.siteId} className="border-b border-sky-50 align-top hover:bg-sky-50/60">
                        <td className="py-3 pr-3 font-semibold text-slate-950">{site?.name ?? assignment.siteId}</td>
                        <td className="py-3 pr-3">{assignment.yearMonth}</td>
                        <td className="py-3 pr-3">{assignment.region}</td>
                        <td className="py-3 pr-3">
                          {assignment.warnings.length ? (
                            <span className="rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-800">
                              {assignment.warnings.join(", ")}
                            </span>
                          ) : (
                            <span className="rounded-md bg-cyan-50 px-2 py-1 font-semibold text-cyan-700">なし</span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-slate-700">{assignment.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredAssignments.length > 250 && (
              <p className="mt-3 text-sm font-semibold text-slate-500">
                表示は250件までです。現在の条件に一致する割当は {filteredAssignments.length} 件あります。
              </p>
            )}
          </div>

          <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">エリア別進捗率</h2>
            <div className="mt-4 grid gap-3">
              {regionSummary.map((item) => (
                <div key={item.region} className="grid gap-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-800">{item.region}</span>
                    <span className="text-slate-600">
                      {item.planned}/{item.total}拠点
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-sky-50">
                    <div className="h-3 rounded-full bg-cyan-500" style={{ width: `${item.rate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </Shell>
  );
}
