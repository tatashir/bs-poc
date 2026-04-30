"use client";

import { ScenarioComparisonTable } from "@/components/ScenarioComparisonTable";
import { ScenarioConfigurator } from "@/components/ScenarioConfigurator";
import { ScenarioLoadChart } from "@/components/ScenarioLoadChart";
import { ScenarioMapPanel } from "@/components/ScenarioMapPanel";
import { ScenarioTimelineChart } from "@/components/ScenarioTimelineChart";
import { useRolloutSimulator } from "@/hooks/useRolloutSimulator";

function getScenarioRecommendation(
  results: NonNullable<ReturnType<typeof useRolloutSimulator>["scenarioResults"]>,
) {
  return [...results].sort((left, right) => {
    const leftScore =
      left.summary.durationMonths * 4 + left.summary.peakSupportLoad * 0.9;
    const rightScore =
      right.summary.durationMonths * 4 + right.summary.peakSupportLoad * 0.9;
    return leftScore - rightScore;
  })[0] ?? null;
}

function SummaryHero({
  scenarioName,
  durationMonths,
  peakSupportLoad,
  peakSitesPerMonth,
  maxActiveBlocks,
  recommendedScenario,
}: {
  scenarioName: string;
  durationMonths: number;
  peakSupportLoad: number;
  peakSitesPerMonth: number;
  maxActiveBlocks: number;
  recommendedScenario: string;
}) {
  const cards = [
    ["選択中シナリオ", scenarioName],
    ["推奨シナリオ", recommendedScenario],
    ["完了までの期間", `${durationMonths}か月`],
    ["最大窓口負荷", String(peakSupportLoad)],
    ["最大月次展開量", `${peakSitesPerMonth}拠点`],
    ["最大同時ブロック数", String(maxActiveBlocks)],
  ];

  return (
    <section className="rounded-[30px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(2,132,199,0.16),_transparent_35%),linear-gradient(135deg,_#ffffff,_#f8fafc)] p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.4)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">
            NATIONWIDE ROLLOUT SIMULATOR
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.7rem]">
            まず案を選ぶ。
            その後で、数字を詰める。
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            良い SaaS は、すべてを一度に見せません。この画面では選択中シナリオを主役にし、
            比較は必要な場面だけ下段に分離しています。
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white/90 px-4 py-4 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500">
            DECISION FLOW
          </p>
          <p className="mt-2 text-sm font-medium text-slate-950">1. シナリオ選択</p>
          <p className="mt-1 text-sm font-medium text-slate-950">2. 地図で展開順確認</p>
          <p className="mt-1 text-sm font-medium text-slate-950">3. 負荷と期間を比較</p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-6">
        {cards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-[22px] border border-slate-200 bg-white/90 px-4 py-3 shadow-sm"
          >
            <p className="text-[11px] text-slate-500">{label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const {
    dataset,
    datasetSummary,
    scenarios,
    scenarioResults,
    selectedScenario,
    selectedScenarioId,
    setSelectedScenarioId,
    addScenario,
    updateScenario,
    removeScenario,
    resetScenarios,
  } = useRolloutSimulator();
  const recommendedScenario = getScenarioRecommendation(scenarioResults);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#edf4ff_42%,_#f8fafc_100%)] px-3 py-4 text-slate-950 sm:px-4 lg:px-6">
      <div className="mx-auto grid max-w-[1560px] gap-5">
        <SummaryHero
          scenarioName={selectedScenario?.config.name ?? "-"}
          durationMonths={selectedScenario?.summary.durationMonths ?? 0}
          peakSupportLoad={selectedScenario?.summary.peakSupportLoad ?? 0}
          peakSitesPerMonth={selectedScenario?.summary.peakSitesPerMonth ?? 0}
          maxActiveBlocks={selectedScenario?.summary.maxActiveBlocks ?? 0}
          recommendedScenario={recommendedScenario?.config.name ?? "-"}
        />

        <ScenarioConfigurator
          scenarios={scenarios}
          results={scenarioResults}
          selectedScenarioId={selectedScenarioId}
          datasetSummary={datasetSummary}
          onAddScenario={addScenario}
          onSelectScenario={setSelectedScenarioId}
          onUpdateScenario={updateScenario}
          onRemoveScenario={removeScenario}
          onResetScenarios={resetScenarios}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
          <ScenarioMapPanel dataset={dataset} scenario={selectedScenario} />
          <div className="grid gap-5">
            <ScenarioTimelineChart scenario={selectedScenario} />
            <ScenarioLoadChart scenario={selectedScenario} />
          </div>
        </div>

        <ScenarioComparisonTable
          results={scenarioResults}
          selectedScenarioId={selectedScenarioId}
          onSelectScenario={setSelectedScenarioId}
        />
      </div>
    </main>
  );
}
