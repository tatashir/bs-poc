import type {
  AssignmentWarning,
  CarrierOffice,
  ParsedCsvResult,
  TargetSite,
} from "@/lib/assignment/types";
import { getRegionFromPrefecture } from "@/lib/assignment/scoring";

type CsvRecord = Record<string, string>;

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows.filter((parsedRow) => parsedRow.some((value) => value.length > 0));
}

function toRecordRows(rows: string[][]): CsvRecord[] {
  const [headerRow, ...bodyRows] = rows;
  const headers = headerRow.map((header) => header.trim());
  return bodyRows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
  );
}

function validateHeaders(
  headerRow: string[],
  requiredHeaders: string[],
  issues: ParsedCsvResult<unknown>["issues"],
) {
  for (const header of requiredHeaders) {
    if (!headerRow.includes(header)) {
      issues.push({ row: 1, message: `必須列 ${header} が見つかりません。` });
    }
  }
}

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function collectCoordinateWarnings(
  lat: number | null,
  lng: number | null,
): AssignmentWarning[] {
  return lat === null || lng === null ? ["MISSING_COORDINATES"] : [];
}

function normalizeServiceArea(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function parseTargetSitesCsv(file: File): Promise<ParsedCsvResult<TargetSite>> {
  const text = await file.text();
  const rows = parseCsvText(text);
  const issues: ParsedCsvResult<TargetSite>["issues"] = [];
  if (rows.length === 0) return { records: [], issues: [{ row: 1, message: "CSV が空です。" }] };

  validateHeaders(
    rows[0],
    [
      "site_id",
      "site_name",
      "prefecture",
      "address",
      "lat",
      "lng",
      "priority",
      "desired_month",
      "status",
    ],
    issues,
  );

  const records = toRecordRows(rows).map((record, index) => {
    const lat = parseNumber(record.lat);
    const lng = parseNumber(record.lng);
    const sourceWarnings = collectCoordinateWarnings(lat, lng);

    if (!record.site_id) issues.push({ row: index + 2, message: "site_id が空です。" });
    if (!record.site_name) issues.push({ row: index + 2, message: "site_name が空です。" });
    if (!record.prefecture) issues.push({ row: index + 2, message: "prefecture が空です。" });

    return {
      siteId: record.site_id,
      siteName: record.site_name,
      prefecture: record.prefecture,
      address: record.address,
      lat,
      lng,
      priority: record.priority,
      desiredMonth: record.desired_month,
      status: record.status,
      region: getRegionFromPrefecture(record.prefecture),
      sourceWarnings,
    };
  });

  return { records, issues };
}

export async function parseCarrierOfficesCsv(
  file: File,
): Promise<ParsedCsvResult<CarrierOffice>> {
  const text = await file.text();
  const rows = parseCsvText(text);
  const issues: ParsedCsvResult<CarrierOffice>["issues"] = [];
  if (rows.length === 0) return { records: [], issues: [{ row: 1, message: "CSV が空です。" }] };

  validateHeaders(
    rows[0],
    [
      "office_id",
      "carrier_name",
      "office_name",
      "prefecture",
      "address",
      "lat",
      "lng",
      "service_area",
      "monthly_capacity",
    ],
    issues,
  );

  const records = toRecordRows(rows).map((record, index) => {
    const lat = parseNumber(record.lat);
    const lng = parseNumber(record.lng);
    const sourceWarnings = collectCoordinateWarnings(lat, lng);

    if (!record.office_id) issues.push({ row: index + 2, message: "office_id が空です。" });
    if (!record.office_name) issues.push({ row: index + 2, message: "office_name が空です。" });
    if (!record.carrier_name) issues.push({ row: index + 2, message: "carrier_name が空です。" });

    return {
      officeId: record.office_id,
      carrierName: record.carrier_name,
      officeName: record.office_name,
      prefecture: record.prefecture,
      address: record.address,
      lat,
      lng,
      serviceArea: normalizeServiceArea(record.service_area),
      monthlyCapacity: Math.max(0, parseNumber(record.monthly_capacity) ?? 0),
      region: getRegionFromPrefecture(record.prefecture),
      sourceWarnings,
    };
  });

  return { records, issues };
}
