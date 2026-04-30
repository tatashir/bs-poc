import type { AssignmentWarning } from "@/lib/assignment/types";

export const warningLabels: Record<AssignmentWarning, string> = {
  CAPACITY_EXCEEDED: "CAPACITY_EXCEEDED",
  FAR_DISTANCE: "FAR_DISTANCE",
  OUT_OF_SERVICE_AREA: "OUT_OF_SERVICE_AREA",
  NO_CANDIDATE: "NO_CANDIDATE",
  MISSING_COORDINATES: "MISSING_COORDINATES",
  MANUAL_OVERRIDE: "MANUAL_OVERRIDE",
};

export function uniqueWarnings(warnings: AssignmentWarning[]) {
  return Array.from(new Set(warnings));
}
