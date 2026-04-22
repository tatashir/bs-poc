"use client";

import { useMemo, useState } from "react";
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
const prefectures = ["北海道", "宮城", "東京", "神奈川", "愛知", "大阪", "広島", "福岡", "沖縄"];
const monthOptions = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

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

export default function Home() {
  const [activeView, setActiveView] = useState<"master" | "settings" | "result">("master");
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [setting, setSetting] = useState<ProjectSetting>(initialSetting);
  const [capacities, setCapacities] = useState<VendorCapacity[]>(() => createInitialCapacities(initialSetting));
  const [draftSite, setDraftSite] = useState<Site>({
    id: "S-009",
    name: "",
    prefecture: "東京",
    region: "関東",
    latitude: 35.68,
    longitude: 139.76,
    difficulty: "中",
    priority: "中",
    blackoutMonths: [],
  });
  const [plan, setPlan] = useState<GeneratedPlan | null>(() =>
    generatePlan(initialSites, createInitialCapacities(initialSetting), initialSetting),
  );

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

  function toggleMonth(target: "snowSeasonMonths" | "busySeasonMonths" | "blackoutMonths", month: string) {
    if (target === "blackoutMonths") {
      setDraftSite((current) => ({
        ...current,
        blackoutMonths: current.blackoutMonths.includes(month)
          ? current.blackoutMonths.filter((item) => item !== month)
          : [...current.blackoutMonths, month],
      }));
      return;
    }

    setSetting((current) => ({
      ...current,
      [target]: current[target].includes(month)
        ? current[target].filter((item) => item !== month)
        : [...current[target], month],
    }));
  }

  function addSite() {
    if (!draftSite.name.trim()) return;
    setSites((current) => [...current, { ...draftSite, name: draftSite.name.trim() }]);
    const nextId = `S-${String(sites.length + 2).padStart(3, "0")}`;
    setDraftSite((current) => ({ ...current, id: nextId, name: "", blackoutMonths: [] }));
  }

  function runPlanner() {
    setPlan(generatePlan(sites, capacities, setting));
    setActiveView("result");
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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold text-emerald-700">NW更改 展開計画PoC</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">負荷分散された拠点展開計画を生成</h1>
            </div>
            <button
              type="button"
              onClick={runPlanner}
              className="h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              計画生成
            </button>
          </div>
          <nav className="grid gap-2 sm:grid-cols-3" aria-label="画面切替">
            {[
              ["master", "マスタ入力"],
              ["settings", "条件設定"],
              ["result", "計画結果"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveView(key as "master" | "settings" | "result")}
                className={`h-10 rounded-md border px-3 text-sm font-semibold ${
                  activeView === key
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {activeView === "master" && (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-950">拠点一覧</h2>
                <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{sites.length}拠点</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
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
                    {sites.map((site) => (
                      <tr key={site.id} className="border-b border-slate-100">
                        <td className="py-3 pr-3 font-semibold text-slate-700">{site.id}</td>
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
            </div>

            <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">拠点追加</h2>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  拠点名
                  <input
                    value={draftSite.name}
                    onChange={(event) => setDraftSite((current) => ({ ...current, name: event.target.value }))}
                    className="h-10 rounded-md border border-slate-300 px-3 font-normal"
                    placeholder="例: 千葉東"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    都道府県
                    <select
                      value={draftSite.prefecture}
                      onChange={(event) => setDraftSite((current) => ({ ...current, prefecture: event.target.value }))}
                      className="h-10 rounded-md border border-slate-300 px-3 font-normal"
                    >
                      {prefectures.map((prefecture) => (
                        <option key={prefecture}>{prefecture}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    地域
                    <select
                      value={draftSite.region}
                      onChange={(event) => setDraftSite((current) => ({ ...current, region: event.target.value as Region }))}
                      className="h-10 rounded-md border border-slate-300 px-3 font-normal"
                    >
                      {regions.map((region) => (
                        <option key={region}>{region}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    難易度
                    <select
                      value={draftSite.difficulty}
                      onChange={(event) =>
                        setDraftSite((current) => ({ ...current, difficulty: event.target.value as Site["difficulty"] }))
                      }
                      className="h-10 rounded-md border border-slate-300 px-3 font-normal"
                    >
                      <option>低</option>
                      <option>中</option>
                      <option>高</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    優先度
                    <select
                      value={draftSite.priority}
                      onChange={(event) =>
                        setDraftSite((current) => ({ ...current, priority: event.target.value as Site["priority"] }))
                      }
                      className="h-10 rounded-md border border-slate-300 px-3 font-normal"
                    >
                      <option>低</option>
                      <option>中</option>
                      <option>高</option>
                    </select>
                  </label>
                </div>
                <fieldset>
                  <legend className="text-sm font-semibold text-slate-700">作業不可月</legend>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {monthOptions.map((month) => (
                      <button
                        key={month}
                        type="button"
                        onClick={() => toggleMonth("blackoutMonths", month)}
                        className={`h-9 rounded-md border text-sm font-semibold ${
                          draftSite.blackoutMonths.includes(month)
                            ? "border-rose-600 bg-rose-50 text-rose-700"
                            : "border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <button
                  type="button"
                  onClick={addSite}
                  className="mt-2 h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  拠点を追加
                </button>
              </div>
            </aside>
          </section>
        )}

        {activeView === "settings" && (
          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">期間と月次件数</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  開始月
                  <input
                    type="month"
                    value={setting.startMonth}
                    onChange={(event) => setSetting((current) => ({ ...current, startMonth: event.target.value }))}
                    className="h-10 rounded-md border border-slate-300 px-3 font-normal"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  終了月
                  <input
                    type="month"
                    value={setting.endMonth}
                    onChange={(event) => setSetting((current) => ({ ...current, endMonth: event.target.value }))}
                    className="h-10 rounded-md border border-slate-300 px-3 font-normal"
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
                    className="h-10 rounded-md border border-slate-300 px-3 font-normal"
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
                    className="h-10 rounded-md border border-slate-300 px-3 font-normal"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
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
                            ? "border-sky-700 bg-sky-50 text-sky-800"
                            : "border-slate-300 bg-white text-slate-700"
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
                            : "border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
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
                        className="h-10 rounded-md border border-slate-300 px-3 font-normal"
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
              <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">Plan</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Version</dt>
                    <dd className="font-semibold text-slate-950">{plan?.plan.version ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Score</dt>
                    <dd className="text-3xl font-bold text-emerald-700">{plan?.plan.score ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Created</dt>
                    <dd className="font-semibold text-slate-950">
                      {plan ? new Date(plan.plan.createdAt).toLocaleString("ja-JP") : "-"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">月次件数表</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySummary}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="拠点数" fill="#047857" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">地図ヒートマップ</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {regionSummary.map((item) => (
                    <div key={item.region} className="rounded-md border border-slate-200 p-3">
                      <div
                        className="mb-3 h-16 rounded-md"
                        style={{
                          background: `linear-gradient(135deg, rgba(4,120,87,${
                            Math.max(item.rate, 12) / 100
                          }), rgba(245,158,11,${Math.max(100 - item.rate, 20) / 140}))`,
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

              <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">エリア別進捗率</h2>
                <div className="mt-4 grid gap-3">
                  {regionSummary.map((item) => (
                    <div key={item.region} className="grid gap-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-slate-800">{item.region}</span>
                        <span className="text-slate-600">{item.rate}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100">
                        <div className="h-3 rounded-full bg-emerald-700" style={{ width: `${item.rate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">割当結果</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
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
                        <tr key={assignment.siteId} className="border-b border-slate-100 align-top">
                          <td className="py-3 pr-3 font-semibold text-slate-950">{site?.name ?? assignment.siteId}</td>
                          <td className="py-3 pr-3">{assignment.yearMonth}</td>
                          <td className="py-3 pr-3">{assignment.region}</td>
                          <td className="py-3 pr-3">
                            {assignment.warnings.length ? (
                              <span className="rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-800">
                                {assignment.warnings.join(", ")}
                              </span>
                            ) : (
                              <span className="rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-800">なし</span>
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
