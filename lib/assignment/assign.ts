import type {
  AssignmentCandidate,
  AssignmentResult,
  CarrierOffice,
  TargetSite,
} from "@/lib/assignment/types";
import { buildWarnings, deriveConfidence, scoreCandidate } from "@/lib/assignment/scoring";

function priorityRank(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["high", "高", "p1", "urgent"].includes(normalized)) return 3;
  if (["medium", "中", "p2"].includes(normalized)) return 2;
  if (["low", "低", "p3"].includes(normalized)) return 1;
  return 0;
}

function candidateSort(a: AssignmentCandidate, b: AssignmentCandidate) {
  if (b.score !== a.score) return b.score - a.score;
  const aDistance = a.distanceKm ?? Number.POSITIVE_INFINITY;
  const bDistance = b.distanceKm ?? Number.POSITIVE_INFINITY;
  return aDistance - bDistance;
}

export function assignSites(
  sites: TargetSite[],
  offices: CarrierOffice[],
): AssignmentResult[] {
  const officeLoad = new Map(offices.map((office) => [office.officeId, 0]));
  const sortedSites = [...sites].sort((a, b) => {
    const priorityDiff = priorityRank(b.priority) - priorityRank(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return a.siteId.localeCompare(b.siteId, "ja");
  });

  return sortedSites.map((site) => {
    const candidates = offices
      .map((office) => scoreCandidate(site, office, officeLoad.get(office.officeId) ?? 0))
      .sort(candidateSort);

    const bestWithinCapacity =
      candidates.find((candidate) => candidate.capacityAvailable) ?? null;
    const bestCandidate = bestWithinCapacity ?? candidates[0] ?? null;
    const office =
      offices.find((item) => item.officeId === bestCandidate?.officeId) ?? null;

    if (!bestCandidate || !office) {
      const warning = buildWarnings(null, site.sourceWarnings, [], false);
      return {
        siteId: site.siteId,
        siteName: site.siteName,
        assignedOfficeId: "",
        assignedOfficeName: "",
        carrierName: "",
        distanceKm: null,
        plannedMonth: site.desiredMonth,
        priority: site.priority,
        confidence: "low",
        warning,
        manuallyOverridden: false,
      };
    }

    officeLoad.set(office.officeId, (officeLoad.get(office.officeId) ?? 0) + 1);
    const warning = buildWarnings(
      bestCandidate,
      site.sourceWarnings,
      office.sourceWarnings,
      false,
    );

    return {
      siteId: site.siteId,
      siteName: site.siteName,
      assignedOfficeId: office.officeId,
      assignedOfficeName: office.officeName,
      carrierName: office.carrierName,
      distanceKm: bestCandidate.distanceKm,
      plannedMonth: site.desiredMonth,
      priority: site.priority,
      confidence: deriveConfidence(bestCandidate, warning),
      warning,
      manuallyOverridden: false,
    };
  });
}

export function recalculateManualAssignment(
  site: TargetSite,
  office: CarrierOffice | null,
  currentLoad: number,
): AssignmentResult {
  if (!office) {
    const warning = buildWarnings(null, site.sourceWarnings, [], true);
    return {
      siteId: site.siteId,
      siteName: site.siteName,
      assignedOfficeId: "",
      assignedOfficeName: "",
      carrierName: "",
      distanceKm: null,
      plannedMonth: site.desiredMonth,
      priority: site.priority,
      confidence: "low",
      warning,
      manuallyOverridden: true,
    };
  }

  const candidate = scoreCandidate(site, office, Math.max(0, currentLoad - 1));
  const warning = buildWarnings(candidate, site.sourceWarnings, office.sourceWarnings, true);
  return {
    siteId: site.siteId,
    siteName: site.siteName,
    assignedOfficeId: office.officeId,
    assignedOfficeName: office.officeName,
    carrierName: office.carrierName,
    distanceKm: candidate.distanceKm,
    plannedMonth: site.desiredMonth,
    priority: site.priority,
    confidence: deriveConfidence(candidate, warning),
    warning,
    manuallyOverridden: true,
  };
}
