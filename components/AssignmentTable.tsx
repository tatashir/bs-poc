"use client";

import type { AssignmentRow, CarrierOffice } from "@/lib/assignment/types";

type Props = {
  rows: AssignmentRow[];
  offices: CarrierOffice[];
  onChangeAssignment: (siteId: string, officeId: string) => void;
};

function confidenceTone(confidence: AssignmentRow["confidence"]) {
  if (confidence === "high") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (confidence === "medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

export function AssignmentTable({
  rows,
  offices,
  onChangeAssignment,
}: Props) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-950">Assignment Result</h2>
        <span className="text-xs text-zinc-500">{rows.length} rows</span>
      </div>
      <div className="max-h-[620px] overflow-auto">
        <table className="w-full min-w-[1080px] text-left text-xs">
          <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Site</th>
              <th className="px-3 py-2 font-medium">Prefecture</th>
              <th className="px-3 py-2 font-medium">Assigned office</th>
              <th className="px-3 py-2 font-medium">Carrier</th>
              <th className="px-3 py-2 font-medium">Distance</th>
              <th className="px-3 py-2 font-medium">Planned month</th>
              <th className="px-3 py-2 font-medium">Priority</th>
              <th className="px-3 py-2 font-medium">Confidence</th>
              <th className="px-3 py-2 font-medium">Warning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.siteId} className="hover:bg-zinc-50">
                <td className="px-3 py-2">
                  <p className="font-medium text-zinc-900">{row.siteName}</p>
                  <p className="text-[11px] text-zinc-500">{row.siteId}</p>
                </td>
                <td className="px-3 py-2 text-zinc-700">{row.site.prefecture}</td>
                <td className="px-3 py-2">
                  <select
                    value={row.assignedOfficeId}
                    onChange={(event) =>
                      onChangeAssignment(row.siteId, event.target.value)
                    }
                    className="h-8 w-full rounded border border-zinc-300 px-2 text-xs text-zinc-700"
                  >
                    <option value="">未割当</option>
                    {offices.map((office) => (
                      <option key={office.officeId} value={office.officeId}>
                        {office.officeName}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-zinc-700">{row.carrierName || "-"}</td>
                <td className="px-3 py-2 text-zinc-700">
                  {row.distanceKm === null ? "-" : `${row.distanceKm} km`}
                </td>
                <td className="px-3 py-2 text-zinc-700">{row.plannedMonth || "-"}</td>
                <td className="px-3 py-2 text-zinc-700">{row.priority || "-"}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${confidenceTone(row.confidence)}`}
                  >
                    {row.confidence}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {row.warning.length === 0 ? (
                      <span className="text-zinc-400">-</span>
                    ) : (
                      row.warning.map((warning) => (
                        <span
                          key={`${row.siteId}-${warning}`}
                          className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-600"
                        >
                          {warning}
                        </span>
                      ))
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
