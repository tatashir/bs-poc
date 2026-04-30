"use client";

import { useMemo, useState } from "react";
import { assignSites, recalculateManualAssignment } from "@/lib/assignment/assign";
import type {
  AssignmentResult,
  AssignmentRow,
  CarrierOffice,
  CsvValidationIssue,
  TargetSite,
} from "@/lib/assignment/types";
import { parseCarrierOfficesCsv, parseTargetSitesCsv } from "@/lib/csv/parse";

function sortIssues(issues: CsvValidationIssue[]) {
  return [...issues].sort((a, b) => a.row - b.row);
}

export function useAssignmentApp() {
  const [targetSites, setTargetSites] = useState<TargetSite[]>([]);
  const [carrierOffices, setCarrierOffices] = useState<CarrierOffice[]>([]);
  const [results, setResults] = useState<AssignmentResult[]>([]);
  const [issues, setIssues] = useState<CsvValidationIssue[]>([]);
  const [loading, setLoading] = useState<"target" | "office" | null>(null);

  async function importTargetSites(file: File) {
    setLoading("target");
    const parsed = await parseTargetSitesCsv(file);
    setTargetSites(parsed.records);
    setResults([]);
    setIssues((prev) => sortIssues([...prev, ...parsed.issues]));
    setLoading(null);
  }

  async function importCarrierOffices(file: File) {
    setLoading("office");
    const parsed = await parseCarrierOfficesCsv(file);
    setCarrierOffices(parsed.records);
    setResults([]);
    setIssues((prev) => sortIssues([...prev, ...parsed.issues]));
    setLoading(null);
  }

  function clearIssues() {
    setIssues([]);
  }

  function runAutoAssignment() {
    setResults(assignSites(targetSites, carrierOffices));
  }

  function updateManualAssignment(siteId: string, officeId: string) {
    setResults((current) => {
      const loadByOffice = new Map<string, number>();
      for (const item of current) {
        if (!item.assignedOfficeId) continue;
        loadByOffice.set(
          item.assignedOfficeId,
          (loadByOffice.get(item.assignedOfficeId) ?? 0) + 1,
        );
      }

      return current.map((item) => {
        if (item.siteId !== siteId) return item;
        const site = targetSites.find((candidate) => candidate.siteId === siteId);
        if (!site) return item;
        const office = carrierOffices.find((candidate) => candidate.officeId === officeId) ?? null;
        return recalculateManualAssignment(
          site,
          office,
          office ? (loadByOffice.get(office.officeId) ?? 0) + (item.assignedOfficeId !== office.officeId ? 1 : 0) : 0,
        );
      });
    });
  }

  const rows = useMemo<AssignmentRow[]>(() => {
    const siteById = new Map(targetSites.map((site) => [site.siteId, site]));
    const officeById = new Map(
      carrierOffices.map((office) => [office.officeId, office]),
    );

    return results
      .map((result) => {
        const site = siteById.get(result.siteId);
        if (!site) return null;
        return {
          ...result,
          site,
          assignedOffice: result.assignedOfficeId
            ? officeById.get(result.assignedOfficeId) ?? null
            : null,
        };
      })
      .filter((row): row is AssignmentRow => row !== null);
  }, [carrierOffices, results, targetSites]);

  const summary = useMemo(() => {
    const assignedCount = results.filter((item) => item.assignedOfficeId).length;
    const highConfidenceCount = results.filter(
      (item) => item.confidence === "high",
    ).length;
    const warningCount = results.reduce(
      (total, item) => total + item.warning.length,
      0,
    );
    const manualOverrideCount = results.filter(
      (item) => item.manuallyOverridden,
    ).length;
    return {
      targetCount: targetSites.length,
      officeCount: carrierOffices.length,
      assignedCount,
      unassignedCount: Math.max(0, results.length - assignedCount),
      highConfidenceCount,
      warningCount,
      manualOverrideCount,
    };
  }, [carrierOffices.length, results, targetSites.length]);

  return {
    targetSites,
    carrierOffices,
    results,
    rows,
    issues,
    loading,
    summary,
    importTargetSites,
    importCarrierOffices,
    clearIssues,
    runAutoAssignment,
    updateManualAssignment,
  };
}
