"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { InteractiveJapanMap } from "@/components/InteractiveJapanMap";
import {
  type CarrierAssignment,
  type CarrierLoad,
  type CarrierOffice,
  type CarrierProvider,
  assignSitesToCarrierOffices,
  calculateCarrierLoads,
  carrierProviderOptions,
  createCarrierOffices,
  initialCarrierProvider,
} from "@/lib/carrier-offices";
import {
  generatePlan,
  getMonthRange,
  type GeneratedPlan,
  type ProjectSetting,
  type Site,
  type VendorCapacity,
} from "@/lib/scheduler";
import { createSiteSet, regions } from "@/lib/site-sets";

const sampleSites = createSiteSet("scale-100");

type CapacityProfile = "balanced" | "conservative" | "aggressive";

type SetupState = {
  startMonth: string;
  endMonth: string;
  provider: CarrierProvider;
  capacityProfile: CapacityProfile;
};

type DataSourceState = {
  label: string;
  rowCount: number;
  updatedAtMs: number;
};

type Toast = { message: string };

type SimulationState = {
  setting: ProjectSetting;
  months: string[];
  capacities: VendorCapacity[];
  generatedPlan: GeneratedPlan;
  carrierOffices: CarrierOffice[];
  carrierAssignments: CarrierAssignment[];
  carrierLoads: CarrierLoad[];
  generatedAt: string;
};

type AssignmentRow = {
  key: string;
  site: Site;
  office: CarrierOffice;
  distanceKm: number;
  warningCount: number;
  scheduleMonth: string;
};

const defaultSetup: SetupState = {
  startMonth: "2026-04",
  endMonth: "2026-12",
  provider: initialCarrierProvider,
  capacityProfile: "balanced",
};

const profileFactor: Record<CapacityProfile, number> = {
  conservative: 0.88,
  balanced: 1,
  aggressive: 1.15,
};

function toProjectSetting(setup: SetupState): ProjectSetting {
  return {
    startMonth: setup.startMonth,
    endMonth: setup.endMonth,
    monthlyMinimum: 120,
    monthlyMaximum: 180,
    snowSeasonMonths: ["01", "02", "12"],
    busySeasonMonths: ["03", "04", "09"],
  };
}

function createCapacities(
  setting: ProjectSetting,
  profile: CapacityProfile,
): VendorCapacity[] {
  const factor = profileFactor[profile];
  const baseByRegion = {
    関東: 180,
    関西: 140,
    中部: 120,
    "北海道・東北": 110,
    "中国・四国": 110,
    "九州・沖縄": 110,
  } as const;

  return regions.flatMap((region) =>
    getMonthRange(setting.startMonth, setting.endMonth).map((yearMonth) => ({
      region,
      yearMonth,
      maxCapacity: Math.max(30, Math.round(baseByRegion[region] * factor)),
    })),
  );
}

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
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

function MapMarkerRadiusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 3.5c-2.5 0-4.5 2-4.5 4.5 0 3.4 4.5 8.8 4.5 8.8s4.5-5.4 4.5-8.8c0-2.5-2-4.5-4.5-4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <path
        d="M9.8 8.5h4.2a2.3 2.3 0 1 1 0 4.6h-1.6a2.3 2.3 0 1 0 0 4.6h3.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="6.5" r="1.2" fill="currentColor" />
      <circle cx="18" cy="12" r="1.2" fill="currentColor" />
      <circle cx="18" cy="17.7" r="1.2" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  const [setup, setSetup] = useState<SetupState>(defaultSetup);
  const [dataSource, setDataSource] = useState<DataSourceState>({
    label: "Sample sites (100)",
    rowCount: 100,
    updatedAtMs: 0,
  });
  const [toast, setToast] = useState<Toast | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [focusedAssignmentKey, setFocusedAssignmentKey] = useState<
    string | null
  >(null);
  const [pinnedAssignmentKey, setPinnedAssignmentKey] = useState<string | null>(
    null,
  );
  const [officeFilter, setOfficeFilter] = useState<string>("all");
  const [monthMode, setMonthMode] = useState<"all" | "monthly">("all");
  const [monthIndex, setMonthIndex] = useState(0);

  useEffect(() => {
    setDataSource((prev) => ({ ...prev, updatedAtMs: Date.now() }));
  }, []);

  function showToast(message: string) {
    setToast({ message });
    window.setTimeout(() => setToast(null), 2200);
  }

  function handleGenerate() {
    if (setup.startMonth > setup.endMonth) {
      showToast("期間が不正です。開始月は終了月以前を指定してください。");
      return;
    }

    const setting = toProjectSetting(setup);
    const months = getMonthRange(setting.startMonth, setting.endMonth);
    if (months.length === 0) {
      showToast("期間の月が取得できませんでした。設定を確認してください。");
      return;
    }

    const capacities = createCapacities(setting, setup.capacityProfile);
    const carrierOffices = createCarrierOffices(setup.provider);
    const carrierAssignments = assignSitesToCarrierOffices(
      sampleSites,
      carrierOffices,
    );
    const generatedPlan = generatePlan(sampleSites, capacities, setting);
    const carrierLoads = calculateCarrierLoads(
      carrierOffices,
      carrierAssignments,
      months.length,
    );

    setSimulation({
      setting,
      months,
      capacities,
      generatedPlan,
      carrierOffices,
      carrierAssignments,
      carrierLoads,
      generatedAt: new Date().toLocaleString("ja-JP"),
    });
    setOfficeFilter("all");
    setMonthMode("all");
    setMonthIndex(0);
    setFocusedAssignmentKey(null);
    setPinnedAssignmentKey(null);
    showToast("Map generated");
  }

  function handleResetScenario() {
    setSimulation(null);
    setOfficeFilter("all");
    setMonthMode("all");
    setMonthIndex(0);
    setFocusedAssignmentKey(null);
    setPinnedAssignmentKey(null);
    setDrawerOpen(false);
    showToast("Scenario reset");
  }

  function handleExportCsv() {
    if (!simulation) return;
    const siteById = new Map(sampleSites.map((site) => [site.id, site]));
    const officeById = new Map(
      simulation.carrierOffices.map((office) => [office.id, office]),
    );
    const planBySiteId = new Map(
      simulation.generatedPlan.assignments.map((assignment) => [
        assignment.siteId,
        assignment,
      ]),
    );

    const rows = simulation.carrierAssignments.map((assignment) => {
      const site = siteById.get(assignment.siteId);
      const office = officeById.get(assignment.carrierOfficeId);
      const plan = planBySiteId.get(assignment.siteId);
      return [
        assignment.siteId,
        site?.name ?? "",
        site?.prefecture ?? "",
        site?.region ?? "",
        office?.name ?? "",
        office?.prefecture ?? "",
        String(assignment.distanceKm),
        plan?.yearMonth ?? "",
        String(plan?.warnings.length ?? 0),
      ];
    });

    const csv = [
      [
        "siteId",
        "siteName",
        "sitePrefecture",
        "region",
        "carrierOffice",
        "officePrefecture",
        "distanceKm",
        "month",
        "warnings",
      ].join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rollout_mapping_export.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported");
  }

  function formatRelativeTime(updatedAtMs: number) {
    if (!updatedAtMs) return "--";
    const diffSec = Math.max(0, Math.floor((Date.now() - updatedAtMs) / 1000));
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h ago`;
    return `${Math.floor(diffSec / 86400)} d ago`;
  }

  const selectedMonth =
    simulation && monthMode === "monthly"
      ? (simulation.months[monthIndex] ?? null)
      : null;
  const filteredPlanAssignments = useMemo(
    () =>
      simulation?.generatedPlan.assignments.filter((assignment) =>
        selectedMonth ? assignment.yearMonth === selectedMonth : true,
      ) ?? [],
    [selectedMonth, simulation],
  );
  const filteredSiteIds = useMemo(
    () =>
      new Set(filteredPlanAssignments.map((assignment) => assignment.siteId)),
    [filteredPlanAssignments],
  );
  const warningBySiteId = useMemo(
    () =>
      new Map(
        filteredPlanAssignments.map((assignment) => [
          assignment.siteId,
          assignment.warnings.length,
        ]),
      ),
    [filteredPlanAssignments],
  );
  const mapSites = useMemo(
    () =>
      selectedMonth
        ? sampleSites.filter((site) => filteredSiteIds.has(site.id))
        : sampleSites,
    [filteredSiteIds, selectedMonth],
  );
  const mapCarrierAssignments = useMemo(
    () =>
      simulation?.carrierAssignments.filter((assignment) =>
        selectedMonth ? filteredSiteIds.has(assignment.siteId) : true,
      ) ?? [],
    [filteredSiteIds, selectedMonth, simulation],
  );

  const assignmentRows = useMemo<AssignmentRow[]>(() => {
    if (!simulation) return [];
    const siteById = new Map(sampleSites.map((site) => [site.id, site]));
    const officeById = new Map(
      simulation.carrierOffices.map((office) => [office.id, office]),
    );
    const planBySiteId = new Map(
      simulation.generatedPlan.assignments.map((assignment) => [
        assignment.siteId,
        assignment,
      ]),
    );

    return simulation.carrierAssignments
      .map((assignment) => {
        const site = siteById.get(assignment.siteId);
        const office = officeById.get(assignment.carrierOfficeId);
        if (!site || !office) return null;
        const scheduled = planBySiteId.get(site.id);
        return {
          key: `${site.id}::${office.id}`,
          site,
          office,
          distanceKm: assignment.distanceKm,
          warningCount: scheduled?.warnings.length ?? 0,
          scheduleMonth: scheduled?.yearMonth ?? "-",
        };
      })
      .filter((row): row is AssignmentRow => row !== null);
  }, [simulation]);

  const filteredAssignmentRows = useMemo(
    () =>
      assignmentRows.filter((row) => {
        if (officeFilter !== "all" && row.office.id !== officeFilter)
          return false;
        if (selectedMonth && row.scheduleMonth !== selectedMonth) return false;
        return true;
      }),
    [assignmentRows, officeFilter, selectedMonth],
  );

  const activeAssignmentKey = pinnedAssignmentKey ?? focusedAssignmentKey;
  const activeAssignment = useMemo(
    () =>
      filteredAssignmentRows.find((row) => row.key === activeAssignmentKey) ??
      null,
    [activeAssignmentKey, filteredAssignmentRows],
  );

  useEffect(() => {
    if (!activeAssignmentKey) return;
    const exists = filteredAssignmentRows.some(
      (row) => row.key === activeAssignmentKey,
    );
    if (!exists) {
      setFocusedAssignmentKey(null);
      setPinnedAssignmentKey(null);
    }
  }, [activeAssignmentKey, filteredAssignmentRows]);

  const warningCount = filteredPlanAssignments.reduce(
    (total, assignment) => total + assignment.warnings.length,
    0,
  );
  const maxLoad = useMemo(() => {
    if (!simulation) return 0;
    if (!selectedMonth)
      return simulation.carrierLoads.reduce(
        (max, load) => Math.max(max, load.loadRatio),
        0,
      );

    const siteCountByOffice = new Map<string, number>();
    for (const assignment of mapCarrierAssignments) {
      siteCountByOffice.set(
        assignment.carrierOfficeId,
        (siteCountByOffice.get(assignment.carrierOfficeId) ?? 0) + 1,
      );
    }

    return simulation.carrierOffices.reduce((max, office) => {
      const assigned = siteCountByOffice.get(office.id) ?? 0;
      const ratio =
        office.monthlyCapacity > 0
          ? Math.round((assigned / office.monthlyCapacity) * 100)
          : 0;
      return Math.max(max, ratio);
    }, 0);
  }, [mapCarrierAssignments, selectedMonth, simulation]);
  const risk =
    maxLoad > 95 || warningCount > 8
      ? "High"
      : maxLoad > 75 || warningCount > 0
        ? "Medium"
        : "Low";
  const monthlyAssignedCounts = useMemo(() => {
    if (!simulation) return [];
    return simulation.months.map((month) => ({
      month,
      count: simulation.generatedPlan.assignments.filter(
        (assignment) => assignment.yearMonth === month,
      ).length,
    }));
  }, [simulation]);
  const peakMonth = monthlyAssignedCounts.reduce(
    (peak, current) => (current.count > peak.count ? current : peak),
    { month: "-", count: 0 },
  );

  return (
    <main className="min-h-screen bg-zinc-100 pt-14 text-zinc-950">
      {toast && (
        <div className="fixed right-4 top-[66px] z-[3200] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-lg">
          {toast.message}
        </div>
      )}

      {drawerOpen && (
        <div
          className="fixed inset-0 z-[3300] bg-zinc-950/30"
          onClick={() => setDrawerOpen(false)}
        >
          <aside
            className="h-full w-[280px] border-r border-zinc-200 bg-white p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <MapMarkerRadiusIcon className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-semibold text-zinc-900">
                Scenario Menu
              </p>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Demo data: {dataSource.label}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Updated: {formatRelativeTime(dataSource.updatedAtMs)}
            </p>

            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={handleResetScenario}
                className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Reset Scenario
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!simulation}
                className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export Mapping CSV
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="h-9 rounded-md border border-zinc-300 bg-zinc-50 px-3 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Close menu
              </button>
            </div>
          </aside>
        </div>
      )}

      <header className="fixed inset-x-0 top-0 z-[3000] border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              aria-label="Open menu"
            >
              <span className="text-base leading-none">≡</span>
            </button>
            <MapMarkerRadiusIcon className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-sm font-semibold tracking-tight text-zinc-950">
                Rollout Cloud
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="h-8 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-500"
          >
            {simulation ? "Run Again" : "Run Simulation"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-4 px-3 py-3 sm:px-4 sm:py-4">
        <Panel
          title="Setup"
          right={
            <span className="text-xs text-zinc-500">
              {dataSource.rowCount} sites
            </span>
          }
        >
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
            <label className="text-xs text-zinc-600">
              Start month
              <input
                type="month"
                value={setup.startMonth}
                onChange={(event) =>
                  setSetup((prev) => ({
                    ...prev,
                    startMonth: event.target.value,
                  }))
                }
                className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-2 text-sm text-zinc-800"
              />
            </label>
            <label className="text-xs text-zinc-600">
              End month
              <input
                type="month"
                value={setup.endMonth}
                onChange={(event) =>
                  setSetup((prev) => ({
                    ...prev,
                    endMonth: event.target.value,
                  }))
                }
                className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-2 text-sm text-zinc-800"
              />
            </label>
            <label className="text-xs text-zinc-600">
              Carrier setup
              <select
                value={setup.provider}
                onChange={(event) =>
                  setSetup((prev) => ({
                    ...prev,
                    provider: event.target.value as CarrierProvider,
                  }))
                }
                className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-2 text-sm text-zinc-800"
              >
                {carrierProviderOptions.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-zinc-600">
              Capacity policy
              <select
                value={setup.capacityProfile}
                onChange={(event) =>
                  setSetup((prev) => ({
                    ...prev,
                    capacityProfile: event.target.value as CapacityProfile,
                  }))
                }
                className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-2 text-sm text-zinc-800"
              >
                <option value="conservative">Conservative</option>
                <option value="balanced">Balanced</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </label>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-xs text-zinc-500">Data source</p>
              <p className="mt-1 truncate text-sm font-medium text-zinc-900">
                {dataSource.label}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {formatRelativeTime(dataSource.updatedAtMs)}
              </p>
            </div>
          </div>
        </Panel>

        {!simulation ? (
          <Panel title="Map">
            <div className="grid min-h-[380px] place-items-center p-6 text-center">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  前提条件を設定してシミュレーションを実行してください
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  データは Sample 100 を固定で使用します。
                </p>
              </div>
            </div>
          </Panel>
        ) : (
          <>
            <Panel title="Summary">
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-xs text-zinc-600">
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
                  Assigned {filteredPlanAssignments.length} /{" "}
                  {sampleSites.length}
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
                  Peak {peakMonth.month}
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
                  Warnings {warningCount}
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
                  Risk {risk}
                </span>
                <span className="ml-auto text-[11px] text-zinc-500">
                  {simulation.generatedAt}
                </span>
              </div>
            </Panel>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Panel title="Map">
                <div className="h-[420px] p-3 sm:h-[560px]">
                  <InteractiveJapanMap
                    sites={mapSites}
                    carrierOffices={simulation.carrierOffices}
                    carrierAssignments={mapCarrierAssignments}
                    warningBySiteId={warningBySiteId}
                    highlightedSiteId={activeAssignment?.site.id ?? null}
                    highlightedCarrierOfficeId={
                      activeAssignment?.office.id ?? null
                    }
                  />
                </div>
                <div className="border-t border-zinc-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMonthMode("all")}
                      className={`h-7 rounded-md px-2.5 text-xs font-medium ${
                        monthMode === "all"
                          ? "bg-blue-600 text-white"
                          : "border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      All months
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonthMode("monthly")}
                      className={`h-7 rounded-md px-2.5 text-xs font-medium ${
                        monthMode === "monthly"
                          ? "bg-blue-600 text-white"
                          : "border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      Monthly
                    </button>
                    <span className="text-xs text-zinc-500">
                      {monthMode === "all" ? "All months" : selectedMonth}
                    </span>
                  </div>
                  {monthMode === "monthly" && (
                    <>
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0, simulation.months.length - 1)}
                          value={monthIndex}
                          onChange={(event) =>
                            setMonthIndex(Number(event.target.value))
                          }
                          className="h-1 w-full accent-blue-600"
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
                        <span>{simulation.months[0]}</span>
                        <span>
                          {simulation.months[simulation.months.length - 1]}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </Panel>

              <Panel
                title="Site-Carrier mapping"
                right={
                  <span className="text-xs text-zinc-500">
                    {filteredAssignmentRows.length} links
                  </span>
                }
              >
                <div className="border-b border-zinc-100 px-4 py-3">
                  <label
                    className="text-xs font-medium text-zinc-600"
                    htmlFor="office-filter"
                  >
                    Carrier office
                  </label>
                  <select
                    id="office-filter"
                    value={officeFilter}
                    onChange={(event) => setOfficeFilter(event.target.value)}
                    className="mt-1 h-8 w-full rounded border border-zinc-300 px-2 text-xs text-zinc-700"
                  >
                    <option value="all">All offices</option>
                    {simulation.carrierOffices.map((office) => (
                      <option key={office.id} value={office.id}>
                        {office.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="max-h-[504px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Site</th>
                        <th className="px-3 py-2 font-medium">Office</th>
                        <th className="px-3 py-2 font-medium">Dist</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredAssignmentRows.slice(0, 160).map((row) => {
                        const active = activeAssignment?.key === row.key;
                        return (
                          <tr
                            key={row.key}
                            className={
                              active ? "bg-blue-50" : "hover:bg-zinc-50"
                            }
                            onMouseEnter={() =>
                              setFocusedAssignmentKey(row.key)
                            }
                            onMouseLeave={() => setFocusedAssignmentKey(null)}
                            onClick={() =>
                              setPinnedAssignmentKey((current) =>
                                current === row.key ? null : row.key,
                              )
                            }
                          >
                            <td className="px-3 py-2">
                              <p className="font-medium text-zinc-900">
                                {row.site.name}
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                {row.site.prefecture} / {row.scheduleMonth} / W:
                                {row.warningCount}
                              </p>
                            </td>
                            <td className="px-3 py-2 text-zinc-700">
                              {row.office.prefecture}
                            </td>
                            <td className="px-3 py-2 text-zinc-700">
                              {row.distanceKm}km
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
