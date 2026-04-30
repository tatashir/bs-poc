"use client";

import { scenarioPresetLabels } from "@/lib/simulator/engine";
import type { ScenarioResult } from "@/lib/simulator/types";

export function ScenarioComparisonTable({
  results,
  selectedScenarioId,
  onSelectScenario,
}: {
  results: ScenarioResult[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
}) {
  const sorted = [...results].sort((left, right) => {
    const leftScore =
      left.summary.durationMonths * 4 + left.summary.peakSupportLoad * 0.9;
    const rightScore =
      right.summary.durationMonths * 4 + right.summary.peakSupportLoad * 0.9;
    return leftScore - rightScore;
  });
  const recommendedId = sorted[0]?.config.id ?? null;

  return (
    <section className="rounded-[26px] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Comparison</h2>
          <p className="mt-1 text-xs text-slate-500">
            下段ではシナリオ間の差分だけを比較します。
          </p>
        </div>
        {recommendedId && (
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            推奨案: {results.find((item) => item.config.id === recommendedId)?.config.name}
          </div>
        )}
      </div>
      <div className="grid gap-3 border-b border-slate-100 px-5 py-4 md:grid-cols-3">
        {sorted.slice(0, 3).map((result, index) => (
          <button
            key={result.config.id}
            type="button"
            onClick={() => onSelectScenario(result.config.id)}
            className={`rounded-2xl border px-4 py-4 text-left ${
              result.config.id === selectedScenarioId
                ? "border-slate-950 bg-slate-950 text-white"
                : index === 0
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{result.config.name}</p>
              {index === 0 && (
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                  result.config.id === selectedScenarioId
                    ? "bg-white/10 text-white"
                    : "bg-white text-emerald-700"
                }`}>
                  RECOMMENDED
                </span>
              )}
            </div>
            <p className={`mt-1 text-[11px] ${
              result.config.id === selectedScenarioId ? "text-slate-300" : "text-slate-500"
            }`}>
              {scenarioPresetLabels[result.config.preset]}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <p className={result.config.id === selectedScenarioId ? "text-slate-300" : "text-slate-500"}>期間</p>
                <p className="mt-1 font-semibold">{result.summary.durationMonths}か月</p>
              </div>
              <div>
                <p className={result.config.id === selectedScenarioId ? "text-slate-300" : "text-slate-500"}>Peak</p>
                <p className="mt-1 font-semibold">{result.summary.peakSupportLoad}</p>
              </div>
              <div>
                <p className={result.config.id === selectedScenarioId ? "text-slate-300" : "text-slate-500"}>Blocks</p>
                <p className="mt-1 font-semibold">{result.summary.maxActiveBlocks}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Scenario</th>
              <th className="px-4 py-3 font-medium">Preset</th>
              <th className="px-4 py-3 font-medium">期間</th>
              <th className="px-4 py-3 font-medium">Peak sites</th>
              <th className="px-4 py-3 font-medium">Peak HQ</th>
              <th className="px-4 py-3 font-medium">Peak support</th>
              <th className="px-4 py-3 font-medium">Avg support</th>
              <th className="px-4 py-3 font-medium">Max blocks</th>
              <th className="px-4 py-3 font-medium">期間レンジ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((result) => {
              const selected = result.config.id === selectedScenarioId;
              return (
                <tr
                  key={result.config.id}
                  className={
                    selected
                      ? "bg-slate-950 text-white"
                      : result.config.id === recommendedId
                        ? "bg-emerald-50/70 hover:bg-emerald-50"
                        : "hover:bg-slate-50"
                  }
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectScenario(result.config.id)}
                      className="font-semibold"
                    >
                      {result.config.name}
                    </button>
                  </td>
                  <td className="px-4 py-3">{scenarioPresetLabels[result.config.preset]}</td>
                  <td className="px-4 py-3">{result.summary.durationMonths}か月</td>
                  <td className="px-4 py-3">{result.summary.peakSitesPerMonth}</td>
                  <td className="px-4 py-3">{result.summary.peakDistrictsPerMonth}</td>
                  <td className="px-4 py-3">{result.summary.peakSupportLoad}</td>
                  <td className="px-4 py-3">{result.summary.averageSupportLoad}</td>
                  <td className="px-4 py-3">{result.summary.maxActiveBlocks}</td>
                  <td className="px-4 py-3">
                    {result.summary.startMonth} - {result.summary.endMonth}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
