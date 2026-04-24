"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { InteractiveJapanMap } from "@/components/InteractiveJapanMap";
import {
  assignSitesToCarrierOffices,
  calculateCarrierLoads,
  initialCarrierOffices,
} from "@/lib/carrier-offices";
import {
  generatePlan,
  getMonthRange,
  type ProjectSetting,
  type Region,
  type Site,
  type VendorCapacity,
} from "@/lib/scheduler";
import { createSiteSet, regions } from "@/lib/site-sets";

const projectSetting: ProjectSetting = {
  startMonth: "2026-04",
  endMonth: "2026-12",
  monthlyMinimum: 120,
  monthlyMaximum: 180,
  snowSeasonMonths: ["01", "02", "12"],
  busySeasonMonths: ["03", "04", "09"],
};

const defaultSites = createSiteSet("scale-100");

type UploadState = {
  fileName: string;
  importedAt: string;
  rowCount: number;
};

type Toast = {
  message: string;
};

function createCapacities(setting: ProjectSetting): VendorCapacity[] {
  return regions.flatMap((region) =>
    getMonthRange(setting.startMonth, setting.endMonth).map((yearMonth) => ({
      region,
      yearMonth,
      maxCapacity: region === "関東" ? 180 : region === "関西" ? 140 : 110,
    })),
  );
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values.map((value) => value.replace(/^"|"$/g, ""));
}

function normalizeDifficulty(value: string): Site["difficulty"] {
  if (value === "高" || value.toLowerCase() === "high") return "高";
  if (value === "中" || value.toLowerCase() === "medium") return "中";
  return "低";
}

function normalizePriority(value: string): Site["priority"] {
  if (value === "高" || value.toLowerCase() === "high") return "高";
  if (value === "中" || value.toLowerCase() === "medium") return "中";
  return "低";
}

function normalizeRegion(value: string): Region {
  return regions.find((region) => region === value) ?? "関東";
}

function parseSitesCsv(text: string): Site[] {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!headerLine) return [];

  const headers = parseCsvLine(headerLine).map((header) => header.trim());
  const indexOf = (name: string) => headers.findIndex((header) => header.toLowerCase() === name.toLowerCase());

  return lines
    .map((line, index) => {
      const values = parseCsvLine(line);
      const get = (name: string, fallback = "") => {
        const position = indexOf(name);
        return position >= 0 ? values[position] ?? fallback : fallback;
      };

      const latitude = Number(get("latitude", "35.68"));
      const longitude = Number(get("longitude", "139.76"));
      const blackoutMonths = get("blackoutMonths")
        .split(/[|;]/)
        .map((month) => month.trim())
        .filter(Boolean);

      return {
        id: get("id", `CSV-${String(index + 1).padStart(4, "0")}`),
        name: get("name", `Imported site ${index + 1}`),
        prefecture: get("prefecture", "東京"),
        region: normalizeRegion(get("region", "関東")),
        latitude: Number.isFinite(latitude) ? latitude : 35.68,
        longitude: Number.isFinite(longitude) ? longitude : 139.76,
        difficulty: normalizeDifficulty(get("difficulty", "中")),
        priority: normalizePriority(get("priority", "中")),
        blackoutMonths: blackoutMonths.map((month) => month.padStart(2, "0")),
      };
    })
    .filter((site) => site.name.length > 0);
}

function KpiCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-950">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{helper}</p>
    </div>
  );
}

function Panel({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const [sites, setSites] = useState<Site[]>(defaultSites);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [mounted, setMounted] = useState(false);

  const months = useMemo(() => getMonthRange(projectSetting.startMonth, projectSetting.endMonth), []);
  const capacities = useMemo(() => createCapacities(projectSetting), []);
  const plan = useMemo(() => generatePlan(sites, capacities, projectSetting), [capacities, sites]);
  const assignments = useMemo(() => assignSitesToCarrierOffices(sites, initialCarrierOffices), [sites]);
  const carrierLoads = useMemo(
    () => calculateCarrierLoads(initialCarrierOffices, assignments, months.length),
    [assignments, months.length],
  );

  const monthlyData = useMemo(
    () =>
      months.map((month) => ({
        month,
        assigned: plan.assignments.filter((assignment) => assignment.yearMonth === month).length,
      })),
    [months, plan.assignments],
  );

  const warningCount = plan.assignments.reduce((total, assignment) => total + assignment.warnings.length, 0);
  const warningBySiteId = useMemo(
    () => new Map(plan.assignments.map((assignment) => [assignment.siteId, assignment.warnings.length])),
    [plan.assignments],
  );
  const maxLoad = carrierLoads.reduce((max, load) => Math.max(max, load.loadRatio), 0);
  const completion = sites.length === 0 ? 0 : Math.round((plan.assignments.length / sites.length) * 100);
  const risk = maxLoad > 95 || warningCount > 8 ? "High" : maxLoad > 75 || warningCount > 0 ? "Medium" : "Low";
  const topRisks = [
    `Open warnings: ${warningCount}`,
    `Max carrier load: ${maxLoad}%`,
    `Sites with blackout month: ${sites.filter((site) => site.blackoutMonths.length > 0).length}`,
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  function showToast(message: string) {
    setToast({ message });
    window.setTimeout(() => setToast(null), 2200);
  }

  function handleCsvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseSitesCsv(String(reader.result ?? ""));
      if (parsed.length === 0) {
        showToast("CSVに有効な拠点行がありません。");
        return;
      }
      setSites(parsed);
      setUpload({
        fileName: file.name,
        importedAt: new Date().toLocaleString("ja-JP"),
        rowCount: parsed.length,
      });
      showToast(`${parsed.length} sites imported`);
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen bg-zinc-100 pt-14 text-zinc-950">
      {toast && (
        <div className="fixed right-5 top-[68px] z-[3100] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-lg">
          {toast.message}
        </div>
      )}

      <header className="fixed inset-x-0 top-0 z-[3000] border-b border-zinc-300 bg-white">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded bg-zinc-900 text-xs font-semibold text-white">NW</div>
            <div>
              <p className="text-sm font-semibold">Rollout Dashboard</p>
              <p className="text-xs text-zinc-500">全国 NW 更改 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex h-8 cursor-pointer items-center rounded border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
              Import CSV
              <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="sr-only" />
            </label>
            <button
              type="button"
              onClick={() => showToast("Simulation refreshed")}
              className="h-8 rounded bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800"
            >
              Run simulation
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-56px)] lg:grid-cols-[180px_minmax(0,1fr)]">
        <aside className="border-r border-zinc-200 bg-white">
          <div className="p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Workspace</p>
            <p className="mt-1 text-sm font-semibold text-zinc-950">Network Rollout</p>
            <div className="mt-5 rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">Current</p>
              <p className="mt-1 text-sm font-medium text-zinc-950">Dashboard</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4">
            <section className="grid gap-4 md:grid-cols-3">
              <KpiCard label="Sites loaded" value={`${sites.length}`} helper={upload ? upload.fileName : "Default set: 100"} />
              <KpiCard label="Plan coverage" value={`${completion}%`} helper={`${projectSetting.startMonth} - ${projectSetting.endMonth}`} />
              <KpiCard label="Capacity risk" value={risk} helper={`Max load ${maxLoad}%`} />
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-h-[560px]">
                <InteractiveJapanMap
                  sites={sites}
                  carrierOffices={initialCarrierOffices}
                  carrierAssignments={assignments}
                  warningBySiteId={warningBySiteId}
                />
              </div>
              <Panel title="Plan review">
                <div className="divide-y divide-zinc-100">
                  {topRisks.map((item) => (
                    <p key={item} className="px-4 py-3 text-sm text-zinc-700">
                      {item}
                    </p>
                  ))}
                  <p className="px-4 py-3 text-sm text-zinc-700">
                    {upload ? `Last import: ${upload.importedAt}` : "Data source: default mock dataset"}
                  </p>
                </div>
              </Panel>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Panel title="Monthly deployment">
                <div className="h-[260px] p-4">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
                        <XAxis dataKey="month" stroke="#71717a" tickLine={false} />
                        <YAxis stroke="#71717a" tickLine={false} allowDecimals={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="assigned" stroke="#18181b" fill="#e4e4e7" name="Assigned" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full rounded bg-zinc-50" />
                  )}
                </div>
              </Panel>
              <Panel title="Carrier load">
                <div className="divide-y divide-zinc-100">
                  {carrierLoads.slice(0, 6).map((load) => (
                    <div key={load.office.id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-950">{load.office.prefecture}</span>
                        <span className="text-sm text-zinc-600">{load.loadRatio}%</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded bg-zinc-100">
                        <div
                          className={`h-1.5 rounded ${load.loadRatio > 95 ? "bg-red-600" : load.loadRatio > 75 ? "bg-amber-500" : "bg-zinc-800"}`}
                          style={{ width: `${Math.min(100, load.loadRatio)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>

            <Panel title="Sites" right={<span className="text-xs text-zinc-500">Showing 20 rows</span>}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-zinc-50 text-xs font-medium uppercase text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Site</th>
                      <th className="px-4 py-3">Region</th>
                      <th className="px-4 py-3">Difficulty</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">Warnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {sites.slice(0, 20).map((site) => {
                      const assignment = plan.assignments.find((item) => item.siteId === site.id);
                      return (
                        <tr key={site.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-zinc-950">{site.name}</p>
                            <p className="mt-1 text-xs text-zinc-500">{site.prefecture}</p>
                          </td>
                          <td className="px-4 py-3 text-zinc-700">{site.region}</td>
                          <td className="px-4 py-3 text-zinc-700">{site.difficulty}</td>
                          <td className="px-4 py-3 text-zinc-700">{site.priority}</td>
                          <td className="px-4 py-3 text-zinc-700">{assignment?.yearMonth ?? "-"}</td>
                          <td className="px-4 py-3 text-zinc-700">{assignment?.warnings.length ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}
