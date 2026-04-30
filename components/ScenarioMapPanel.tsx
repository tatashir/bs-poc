"use client";

import { useEffect, useMemo, useState } from "react";
import { InteractiveJapanMap } from "@/components/InteractiveJapanMap";
import type { ScenarioResult, SimulationDataset, SiteRecord } from "@/lib/simulator/types";

function mapPriority(site: SiteRecord): "低" | "中" | "高" {
  if (site.type === "事務所") return "低";
  if (site.type === "営業所") return "中";
  return "高";
}

function mapDifficulty(site: SiteRecord): "低" | "中" | "高" {
  if (site.type === "販売店") return "中";
  if (site.type === "営業所") return "高";
  return "低";
}

export function ScenarioMapPanel({
  dataset,
  scenario,
}: {
  dataset: SimulationDataset;
  scenario: ScenarioResult | null;
}) {
  const [viewMode, setViewMode] = useState<"cumulative" | "monthly" | "all">(
    "cumulative",
  );
  const [monthIndex, setMonthIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showDistrictHqs, setShowDistrictHqs] = useState(true);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setFullscreen(false);
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const maxMonthIndex = Math.max(
    0,
    (scenario?.monthlyPoints.length ?? 1) - 1,
  );
  const safeMonthIndex = Math.min(monthIndex, maxMonthIndex);
  const visibleSiteIds = useMemo(() => {
    if (!scenario) return new Set(dataset.sites.map((site) => site.id));
    const targetPlans =
      viewMode === "all"
        ? scenario.districtPlans
        : scenario.districtPlans.filter((plan) =>
            viewMode === "monthly"
              ? plan.monthIndex === safeMonthIndex
              : plan.monthIndex <= safeMonthIndex,
          );
    const targetHqIds = new Set(targetPlans.map((plan) => plan.districtHqId));
    return new Set(
      dataset.sites
        .filter((site) => targetHqIds.has(site.districtHqId))
        .map((site) => site.id),
    );
  }, [dataset.sites, safeMonthIndex, scenario, viewMode]);

  const mapSites = useMemo(
    () =>
      dataset.sites
        .filter((site) => visibleSiteIds.has(site.id))
        .map((site) => ({
          id: site.id,
          name: site.name,
          prefecture: site.prefecture,
          region: site.region,
          latitude: site.lat,
          longitude: site.lng,
          difficulty: mapDifficulty(site),
          priority: mapPriority(site),
          blackoutMonths: [],
        })),
    [dataset.sites, visibleSiteIds],
  );

  const carrierOffices = useMemo(
    () =>
      dataset.districtHqs.map((hq) => ({
        id: hq.id,
        name: hq.name,
        region: hq.region,
        prefecture: hq.prefecture,
        latitude: hq.lat,
        longitude: hq.lng,
        engineers: 0,
        vehicles: 0,
        monthlyCapacity: hq.managedSiteCount,
        serviceRegions: [hq.region],
      })),
    [dataset.districtHqs],
  );

  const carrierAssignments = useMemo(
    () =>
      dataset.sites
        .filter((site) => visibleSiteIds.has(site.id))
        .map((site) => ({
          siteId: site.id,
          carrierOfficeId: site.districtHqId,
          distanceKm: 0,
          reason: "district",
        })),
    [dataset.sites, visibleSiteIds],
  );

  const warningBySiteId = useMemo(() => {
    if (!scenario) return new Map<string, number>();
    const activeHqIds = new Set(
      scenario.districtPlans
        .filter((plan) => plan.monthIndex === safeMonthIndex)
        .map((plan) => plan.districtHqId),
    );
    return new Map(
      dataset.sites.map((site) => [
        site.id,
        activeHqIds.has(site.districtHqId) ? 1 : 0,
      ]),
    );
  }, [dataset.sites, safeMonthIndex, scenario]);

  const activeMonth = scenario?.monthlyPoints[safeMonthIndex] ?? null;

  function renderMapCard(fullscreenMode: boolean) {
    return (
      <section
        className={
          fullscreenMode
            ? "flex h-full flex-col bg-slate-950 text-white"
            : "rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]"
        }
      >
        <div
          className={`flex flex-wrap items-center justify-between gap-3 ${
            fullscreenMode
              ? "border-b border-white/10 px-5 py-4"
              : "border-b border-slate-200 px-5 py-4"
          }`}
        >
          <div>
            <h2
              className={`text-sm font-semibold ${
                fullscreenMode ? "text-white" : "text-slate-950"
              }`}
            >
              Rollout Map
            </h2>
            <p
              className={`mt-1 text-xs ${
                fullscreenMode ? "text-slate-300" : "text-slate-500"
              }`}
            >
              地区本部単位の展開結果を月別または累積で確認します。
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[
              ["cumulative", "累積"],
              ["monthly", "当月"],
              ["all", "全量"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setViewMode(key as "cumulative" | "monthly" | "all")
                }
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  viewMode === key
                    ? fullscreenMode
                      ? "bg-white text-slate-950"
                      : "bg-slate-950 text-white"
                    : fullscreenMode
                      ? "border border-white/15 text-slate-200 hover:bg-white/10"
                      : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowDistrictHqs((current) => !current)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                fullscreenMode
                  ? "border border-white/15 text-slate-200 hover:bg-white/10"
                  : "border border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {showDistrictHqs ? "地区本部表示: ON" : "地区本部表示: OFF"}
            </button>
            <button
              type="button"
              onClick={() => setFullscreen((current) => !current)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                fullscreenMode
                  ? "border border-white/15 text-slate-200 hover:bg-white/10"
                  : "border border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {fullscreenMode ? "閉じる" : "フルスクリーン"}
            </button>
          </div>
        </div>

        {scenario && (
          <div
            className={`border-b px-5 py-4 ${
              fullscreenMode ? "border-white/10" : "border-slate-200"
            }`}
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <input
                  type="range"
                  min={0}
                  max={maxMonthIndex}
                  value={safeMonthIndex}
                  onChange={(event) => setMonthIndex(Number(event.target.value))}
                  className="w-full accent-sky-500"
                />
                <div
                  className={`mt-2 flex justify-between text-[11px] ${
                    fullscreenMode ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  <span>{scenario.summary.startMonth}</span>
                  <span>{scenario.summary.endMonth}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div
                  className={`rounded-2xl px-3 py-2 ${
                    fullscreenMode ? "bg-white/10" : "bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-[11px] ${
                      fullscreenMode ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    Month
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      fullscreenMode ? "text-white" : "text-slate-950"
                    }`}
                  >
                    {activeMonth?.yearMonth ?? "-"}
                  </p>
                </div>
                <div
                  className={`rounded-2xl px-3 py-2 ${
                    fullscreenMode ? "bg-white/10" : "bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-[11px] ${
                      fullscreenMode ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    HQ
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      fullscreenMode ? "text-white" : "text-slate-950"
                    }`}
                  >
                    {activeMonth?.districtCount ?? 0}
                  </p>
                </div>
                <div
                  className={`rounded-2xl px-3 py-2 ${
                    fullscreenMode ? "bg-white/10" : "bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-[11px] ${
                      fullscreenMode ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    Sites
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      fullscreenMode ? "text-white" : "text-slate-950"
                    }`}
                  >
                    {activeMonth?.siteCount ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={fullscreenMode ? "flex-1 p-4" : "h-[620px] p-4"}>
          <div className="h-full min-h-[420px]">
            <InteractiveJapanMap
              sites={mapSites}
              carrierOffices={showDistrictHqs ? carrierOffices : []}
              carrierAssignments={showDistrictHqs ? carrierAssignments : []}
              warningBySiteId={warningBySiteId}
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {renderMapCard(false)}
      {fullscreen && (
        <div className="fixed inset-0 z-[5000] bg-slate-950/80 p-3 backdrop-blur-sm sm:p-5">
          <div className="h-full rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl">
            {renderMapCard(true)}
          </div>
        </div>
      )}
    </>
  );
}
