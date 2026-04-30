"use client";

import { scenarioPresetDescriptions, scenarioPresetLabels } from "@/lib/simulator/engine";
import type {
  ScenarioConfig,
  ScenarioPreset,
  ScenarioResult,
} from "@/lib/simulator/types";

type Props = {
  scenarios: ScenarioConfig[];
  results: ScenarioResult[];
  selectedScenarioId: string;
  datasetSummary: {
    siteCount: number;
    districtCount: number;
    prefectureCount: number;
    typeCounts: { 販売店: number; 営業所: number; 事務所: number };
  };
  onAddScenario: (preset: ScenarioPreset) => void;
  onSelectScenario: (id: string) => void;
  onUpdateScenario: (id: string, patch: Partial<ScenarioConfig>) => void;
  onRemoveScenario: (id: string) => void;
  onResetScenarios: () => void;
};

export function ScenarioConfigurator({
  scenarios,
  results,
  selectedScenarioId,
  datasetSummary,
  onAddScenario,
  onSelectScenario,
  onUpdateScenario,
  onRemoveScenario,
  onResetScenarios,
}: Props) {
  const selectedScenario =
    scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0];
  const selectedResult =
    results.find((result) => result.config.id === selectedScenario?.id) ?? null;

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Scenario Studio</h2>
          <p className="mt-1 text-xs text-slate-500">
            まず案を選び、次に条件を調整します。
          </p>
        </div>
        <button
          type="button"
          onClick={onResetScenarios}
          className="h-9 rounded-full border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          既定3案に戻す
        </button>
      </div>

      <div className="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {scenarios.map((scenario) => {
              const selected = scenario.id === selectedScenarioId;
              const result = results.find((item) => item.config.id === scenario.id);
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => onSelectScenario(scenario.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    selected
                      ? "border-slate-950 bg-slate-950 text-white shadow-lg"
                      : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold">{scenario.name}</p>
                  <p className={`mt-1 text-[11px] ${selected ? "text-slate-300" : "text-slate-500"}`}>
                    {scenarioPresetLabels[scenario.preset]}
                  </p>
                  <p className={`mt-2 text-[11px] ${selected ? "text-slate-300" : "text-slate-500"}`}>
                    {result?.summary.durationMonths ?? 0}か月 / Peak {result?.summary.peakSupportLoad ?? 0}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedScenario && (
            <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-semibold text-slate-100">
                    {scenarioPresetLabels[selectedScenario.preset]}
                  </span>
                  <input
                    value={selectedScenario.name}
                    onChange={(event) =>
                      onUpdateScenario(selectedScenario.id, {
                        name: event.target.value,
                      })
                    }
                    className="mt-3 h-11 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-lg font-semibold text-white placeholder:text-slate-300"
                  />
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {scenarioPresetDescriptions[selectedScenario.preset]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveScenario(selectedScenario.id)}
                  disabled={scenarios.length === 1}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 disabled:opacity-30"
                >
                  この案を削除
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-xs text-slate-300">
                  開始月
                  <input
                    type="month"
                    value={selectedScenario.startMonth}
                    onChange={(event) =>
                      onUpdateScenario(selectedScenario.id, {
                        startMonth: event.target.value,
                      })
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white"
                  />
                </label>
                <label className="text-xs text-slate-300">
                  月次地区本部上限
                  <input
                    type="number"
                    min={2}
                    max={16}
                    value={selectedScenario.maxDistrictsPerMonth}
                    onChange={(event) =>
                      onUpdateScenario(selectedScenario.id, {
                        maxDistrictsPerMonth: Number(event.target.value),
                      })
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white"
                  />
                </label>
                <label className="text-xs text-slate-300">
                  月次対象拠点ソフト上限
                  <input
                    type="number"
                    min={40}
                    max={220}
                    step={5}
                    value={selectedScenario.monthlySiteSoftCap}
                    onChange={(event) =>
                      onUpdateScenario(selectedScenario.id, {
                        monthlySiteSoftCap: Number(event.target.value),
                      })
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white"
                  />
                </label>
                <label className="text-xs text-slate-300">
                  窓口余波月数
                  <input
                    type="number"
                    min={0}
                    max={3}
                    value={selectedScenario.carryOverMonths}
                    onChange={(event) =>
                      onUpdateScenario(selectedScenario.id, {
                        carryOverMonths: Number(event.target.value),
                      })
                    }
                    className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white"
                  />
                </label>
              </div>

              {selectedResult && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["期間", `${selectedResult.summary.durationMonths}か月`],
                    ["Peak support", selectedResult.summary.peakSupportLoad],
                    ["Peak sites", `${selectedResult.summary.peakSitesPerMonth}拠点`],
                    ["Active blocks", selectedResult.summary.maxActiveBlocks],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                      <p className="text-[11px] text-slate-300">{label}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">
              FIXED DATASET
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
              {[
                ["対象拠点", datasetSummary.siteCount],
                ["地区本部", datasetSummary.districtCount],
                ["都道府県", datasetSummary.prefectureCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] text-slate-500">{label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs text-slate-600">
              <p>販売店 {datasetSummary.typeCounts.販売店} 拠点</p>
              <p className="mt-1">営業所 {datasetSummary.typeCounts.営業所} 拠点</p>
              <p className="mt-1">事務所 {datasetSummary.typeCounts.事務所} 拠点</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">
              ADD NEW
            </p>
            <div className="mt-3 grid gap-2">
              {(["concurrent", "sequential", "focused"] as ScenarioPreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onAddScenario(preset)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:border-slate-300 hover:bg-white"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {scenarioPresetLabels[preset]}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {scenarioPresetDescriptions[preset]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
