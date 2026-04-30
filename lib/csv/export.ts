import type { AssignmentResult } from "@/lib/assignment/types";

function escapeCell(value: string | number | boolean | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildAssignmentResultCsv(results: AssignmentResult[]) {
  const header = [
    "site_id",
    "site_name",
    "assigned_office_id",
    "assigned_office_name",
    "carrier_name",
    "distance_km",
    "planned_month",
    "priority",
    "confidence",
    "warning",
    "manually_overridden",
  ];

  const rows = results.map((result) =>
    [
      result.siteId,
      result.siteName,
      result.assignedOfficeId,
      result.assignedOfficeName,
      result.carrierName,
      result.distanceKm,
      result.plannedMonth,
      result.priority,
      result.confidence,
      result.warning.join("|"),
      result.manuallyOverridden,
    ]
      .map(escapeCell)
      .join(","),
  );

  return [header.join(","), ...rows].join("\n");
}

export function downloadAssignmentResultCsv(results: AssignmentResult[]) {
  const csv = buildAssignmentResultCsv(results);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "assignment_result.csv";
  link.click();
  URL.revokeObjectURL(url);
}
