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
import {
  generatePlan,
  getMonthRange,
  type GeneratedPlan,
  type ProjectSetting,
  type Region,
  type Site,
  type VendorCapacity,
} from "@/lib/scheduler";

const regions: Region[] = ["北海道・東北", "関東", "中部", "関西", "中国・四国", "九州・沖縄"];
const monthOptions = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
const storageKey = "nw-rollout-planner-poc:v1";

type SiteSet = "sample" | "scale-100" | "scale-1000";

type SavedState = {
  siteSet: SiteSet;
  sites: Site[];
  setting: ProjectSetting;
  capacities: VendorCapacity[];
};

const siteSetOptions: { value: SiteSet; label: string; description: string }[] = [
  { value: "sample", label: "サンプル8拠点", description: "入力内容を確認するための最小データ" },
  { value: "scale-100", label: "100拠点", description: "中規模更改を想定した拠点群" },
  { value: "scale-1000", label: "1000拠点", description: "全国展開規模の拠点群" },
];

const prefectureMasters: {
  prefecture: string;
  region: Region;
  latitude: number;
  longitude: number;
}[] = [
  { prefecture: "北海道", region: "北海道・東北", latitude: 43.06, longitude: 141.35 },
  { prefecture: "宮城", region: "北海道・東北", latitude: 38.27, longitude: 140.87 },
  { prefecture: "東京", region: "関東", latitude: 35.68, longitude: 139.76 },
  { prefecture: "神奈川", region: "関東", latitude: 35.44, longitude: 139.64 },
  { prefecture: "愛知", region: "中部", latitude: 35.18, longitude: 136.9 },
  { prefecture: "大阪", region: "関西", latitude: 34.69, longitude: 135.5 },
  { prefecture: "広島", region: "中国・四国", latitude: 34.39, longitude: 132.46 },
  { prefecture: "福岡", region: "九州・沖縄", latitude: 33.59, longitude: 130.4 },
  { prefecture: "沖縄", region: "九州・沖縄", latitude: 26.21, longitude: 127.68 },
];

const initialSites: Site[] = [
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

function createSiteSet(siteSet: SiteSet): Site[] {
  if (siteSet === "sample") return initialSites;

  const count = siteSet === "scale-100" ? 100 : 1000;

  return Array.from({ length: count }, (_, index) => {
    const master = prefectureMasters[index % prefectureMasters.length];
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
      latitude: Number((master.latitude + ((index % 5) - 2) * 0.08).toFixed(4)),
      longitude: Number((master.longitude + ((index % 7) - 3) * 0.08).toFixed(4)),
      difficulty: difficultyIndex < 2 ? "高" : difficultyIndex < 6 ? "中" : "低",
      priority: priorityIndex < 3 ? "高" : priorityIndex < 8 ? "中" : "低",
      blackoutMonths,
    };
  });
}

function isSavedState(value: unknown): value is SavedState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedState>;
  return (
    typeof candidate.siteSet === "string" &&
    Array.isArray(candidate.sites) &&
    Boolean(candidate.setting) &&
    Array.isArray(candidate.capacities)
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<"master" | "settings" | "result">("master");
  const [storageReady, setStorageReady] = useState(false);
  const [siteSet, setSiteSet] = useState<SiteSet>("sample");
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [setting, setSetting] = useState<ProjectSetting>(initialSetting);
  const [capacities, setCapacities] = useState<VendorCapacity[]>(() => createInitialCapacities(initialSetting));
  const [plan, setPlan] = useState<GeneratedPlan | null>(() =>
    generatePlan(initialSites, createInitialCapacities(initialSetting), initialSetting),
  );

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

      setSiteSet(parsed.siteSet);
      setSites(parsed.sites);
      setSetting(parsed.setting);
      setCapacities(parsed.capacities);
      setPlan(generatePlan(parsed.sites, parsed.capacities, parsed.setting));
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const value: SavedState = {
      siteSet,
      sites,
      setting,
      capacities,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, [capacities, setting, siteSet, sites, storageReady]);

  const months = useMemo(() => getMonthRange(setting.startMonth, setting.endMonth), [setting]);
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
  const visibleSites = useMemo(() => sites.slice(0, 100), [sites]);
  const hiddenSiteCount = Math.max(0, sites.length - visibleSites.length);

  function toggleMonth(target: "snowSeasonMonths" | "busySeasonMonths", month: string) {
    setSetting((current) => ({
      ...current,
      [target]: current[target].includes(month)
        ? current[target].filter((item) => item !== month)
        : [...current[target], month],
    }));
  }

  function runPlanner() {
    setPlan(generatePlan(sites, capacities, setting));
    setActiveView("result");
  }

  function applySiteSet(nextSiteSet: SiteSet) {
    const nextSites = createSiteSet(nextSiteSet);
    setSiteSet(nextSiteSet);
    setSites(nextSites);
    setPlan(null);
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

  return (
    <main className="min-h-screen">
      <header className="border-b border-sky-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-cyan-500 text-base font-black text-white shadow-sm shadow-cyan-200">
                RP
              </div>
              <div>
                <p className="text-sm font-bold text-cyan-700">NW更改 展開計画PoC</p>
                <p className="text-xs font-semibold text-slate-500">Rollout Process Management</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800">
                3画面PoC
              </span>
              <span className="rounded-md border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700">
                DB未接続
              </span>
              <button
                type="button"
                onClick={runPlanner}
                className="h-11 rounded-md bg-cyan-500 px-5 text-sm font-bold text-white shadow-sm shadow-cyan-200 hover:bg-cyan-600"
              >
                計画生成
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="py-3">
              <p className="text-sm font-bold text-cyan-700">拠点・キャパ・季節制約をひとつに集約</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
                全国展開の計画作成を、入力から説明可能な割当まで一気通貫に。
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                拠点情報と施工キャパをもとに、月次負荷をならした展開案を生成します。PoCではCSVを使わず、画面入力だけで計画結果を確認できます。
              </p>
            </div>
            <div>
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md bg-white p-3 shadow-sm">
                  <p className="text-xs font-bold text-slate-500">拠点</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{sites.length}</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm">
                  <p className="text-xs font-bold text-slate-500">期間</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{months.length}</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm">
                  <p className="text-xs font-bold text-slate-500">Score</p>
                  <p className="mt-1 text-2xl font-black text-cyan-700">{plan?.plan.score ?? "-"}</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white">
                <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${plan?.plan.score ?? 0}%` }} />
              </div>
            </div>
          </div>

          <nav className="grid gap-2 rounded-md border border-sky-100 bg-sky-50 p-1 sm:grid-cols-3" aria-label="画面切替">
            {[
              ["master", "マスタ入力"],
              ["settings", "条件設定"],
              ["result", "計画結果"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveView(key as "master" | "settings" | "result")}
                className={`h-10 rounded-md px-3 text-sm font-bold transition ${
                  activeView === key
                    ? "bg-white text-cyan-700 shadow-sm"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        {activeView === "master" && (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">拠点群プレビュー</h2>
                  <p className="mt-1 text-sm text-slate-500">選択中の拠点セットから先頭100件を表示</p>
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

            <aside className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">拠点セット</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                PoCでは個別拠点の手入力ではなく、規模別の疑似データを選択します。
              </p>
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
              <div className="mt-5 rounded-md bg-sky-50 p-4">
                <p className="text-xs font-bold text-slate-500">保存状態</p>
                <p className="mt-1 text-sm font-bold text-slate-950">
                  {storageReady ? "localStorageに自動保存中" : "保存設定を読み込み中"}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  拠点セット、条件設定、地域別施工キャパはブラウザに保存され、リロード後も復元されます。
                </p>
              </div>
            </aside>
          </section>
        )}

        {activeView === "settings" && (
          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">期間と月次件数</h2>
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
                    onChange={(event) =>
                      setSetting((current) => ({ ...current, monthlyMinimum: Number(event.target.value) }))
                    }
                    className="h-10 rounded-md border border-sky-100 px-3 font-normal text-slate-950 shadow-sm"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  月次上限
                  <input
                    type="number"
                    min={1}
                    value={setting.monthlyMaximum}
                    onChange={(event) =>
                      setSetting((current) => ({ ...current, monthlyMaximum: Number(event.target.value) }))
                    }
                    className="h-10 rounded-md border border-sky-100 px-3 font-normal text-slate-950 shadow-sm"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">季節制約</h2>
              <div className="mt-4 grid gap-4">
                <fieldset>
                  <legend className="text-sm font-semibold text-slate-700">降雪期</legend>
                  <div className="mt-2 grid grid-cols-6 gap-2">
                    {monthOptions.map((month) => (
                      <button
                        key={month}
                        type="button"
                        onClick={() => toggleMonth("snowSeasonMonths", month)}
                        className={`h-9 rounded-md border text-sm font-semibold ${
                          setting.snowSeasonMonths.includes(month)
                            ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                            : "border-sky-100 bg-white text-slate-700 hover:bg-sky-50"
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-sm font-semibold text-slate-700">繁忙期</legend>
                  <div className="mt-2 grid grid-cols-6 gap-2">
                    {monthOptions.map((month) => (
                      <button
                        key={month}
                        type="button"
                        onClick={() => toggleMonth("busySeasonMonths", month)}
                        className={`h-9 rounded-md border text-sm font-semibold ${
                          setting.busySeasonMonths.includes(month)
                            ? "border-amber-700 bg-amber-50 text-amber-800"
                            : "border-sky-100 bg-white text-slate-700 hover:bg-sky-50"
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </fieldset>
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

        {activeView === "result" && (
          <section className="grid gap-5">
            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">Plan</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Version</dt>
                    <dd className="font-semibold text-slate-950">{plan?.plan.version ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Score</dt>
                    <dd className="text-3xl font-black text-cyan-700">{plan?.plan.score ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Created</dt>
                    <dd className="font-semibold text-slate-950">
                      {plan ? new Date(plan.plan.createdAt).toLocaleString("ja-JP") : "-"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">月次件数表</h2>
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
              <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">地図ヒートマップ</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {regionSummary.map((item) => (
                    <div key={item.region} className="rounded-md border border-sky-100 bg-white p-3 shadow-sm">
                      <div
                        className="mb-3 h-16 rounded-md"
                        style={{
                          background: `linear-gradient(135deg, rgba(33,190,214,${
                            Math.max(item.rate, 12) / 100
                          }), rgba(247,179,43,${Math.max(100 - item.rate, 20) / 150}))`,
                        }}
                      />
                      <p className="text-sm font-bold text-slate-950">{item.region}</p>
                      <p className="text-sm text-slate-600">
                        {item.planned}/{item.total}拠点
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">エリア別進捗率</h2>
                <div className="mt-4 grid gap-3">
                  {regionSummary.map((item) => (
                    <div key={item.region} className="grid gap-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-slate-800">{item.region}</span>
                        <span className="text-slate-600">{item.rate}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-sky-50">
                        <div className="h-3 rounded-full bg-cyan-500" style={{ width: `${item.rate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-sky-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">割当結果</h2>
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
                    {plan?.assignments.map((assignment) => {
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
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
