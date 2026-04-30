"use client";

import { useMemo, useState } from "react";
import { simulationDataset } from "@/lib/simulator/dummy-data";
import {
  buildDefaultScenarioConfigs,
  scenarioPresetDescriptions,
  scenarioPresetLabels,
  simulateScenario,
} from "@/lib/simulator/engine";
import type {
  ScenarioConfig,
  ScenarioPreset,
} from "@/lib/simulator/types";

function createScenarioFromPreset(
  preset: ScenarioPreset,
  index: number,
): ScenarioConfig {
  const defaults = buildDefaultScenarioConfigs().find(
    (scenario) => scenario.preset === preset,
  );
  if (defaults) {
    return {
      ...defaults,
      id: `scenario-${preset}-${index}`,
      name: `${scenarioPresetLabels[preset]} ${index}`,
    };
  }

  return {
    id: `scenario-${preset}-${index}`,
    name: `${scenarioPresetLabels[preset]} ${index}`,
    preset,
    startMonth: "2026-04",
    maxDistrictsPerMonth: 6,
    monthlySiteSoftCap: 100,
    carryOverMonths: 1,
  };
}

export function useRolloutSimulator() {
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>(
    buildDefaultScenarioConfigs(),
  );
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    buildDefaultScenarioConfigs()[0].id,
  );
  const [nextScenarioIndex, setNextScenarioIndex] = useState(4);

  const scenarioResults = useMemo(
    () => scenarios.map((scenario) => simulateScenario(scenario, simulationDataset)),
    [scenarios],
  );

  const selectedScenario =
    scenarioResults.find((result) => result.config.id === selectedScenarioId) ??
    scenarioResults[0] ??
    null;

  const datasetSummary = useMemo(() => {
    const typeCounts = simulationDataset.sites.reduce(
      (acc, site) => {
        acc[site.type] += 1;
        return acc;
      },
      { 販売店: 0, 営業所: 0, 事務所: 0 },
    );
    return {
      siteCount: simulationDataset.sites.length,
      districtCount: simulationDataset.districtHqs.length,
      prefectureCount: simulationDataset.prefectures.length,
      typeCounts,
    };
  }, []);

  function addScenario(preset: ScenarioPreset) {
    const scenario = createScenarioFromPreset(preset, nextScenarioIndex);
    setScenarios((current) => [...current, scenario]);
    setSelectedScenarioId(scenario.id);
    setNextScenarioIndex((current) => current + 1);
  }

  function updateScenario(id: string, patch: Partial<ScenarioConfig>) {
    setScenarios((current) =>
      current.map((scenario) =>
        scenario.id === id ? { ...scenario, ...patch } : scenario,
      ),
    );
  }

  function removeScenario(id: string) {
    setScenarios((current) => {
      if (current.length === 1) return current;
      const next = current.filter((scenario) => scenario.id !== id);
      if (selectedScenarioId === id) {
        setSelectedScenarioId(next[0]?.id ?? "");
      }
      return next;
    });
  }

  function resetScenarios() {
    const defaults = buildDefaultScenarioConfigs();
    setScenarios(defaults);
    setSelectedScenarioId(defaults[0].id);
    setNextScenarioIndex(4);
  }

  return {
    dataset: simulationDataset,
    datasetSummary,
    scenarios,
    scenarioResults,
    selectedScenario,
    selectedScenarioId,
    scenarioPresetLabels,
    scenarioPresetDescriptions,
    setSelectedScenarioId,
    addScenario,
    updateScenario,
    removeScenario,
    resetScenarios,
  };
}
