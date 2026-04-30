"use client";

import type { CsvValidationIssue } from "@/lib/assignment/types";

type Props = {
  targetCount: number;
  officeCount: number;
  loading: "target" | "office" | null;
  issues: CsvValidationIssue[];
  onTargetFileChange: (file: File) => void | Promise<void>;
  onOfficeFileChange: (file: File) => void | Promise<void>;
  onRunAssignment: () => void;
  onClearIssues: () => void;
};

export function CsvImportPanel({
  targetCount,
  officeCount,
  loading,
  issues,
  onTargetFileChange,
  onOfficeFileChange,
  onRunAssignment,
  onClearIssues,
}: Props) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-950">CSV Import</h2>
        <button
          type="button"
          onClick={onRunAssignment}
          disabled={targetCount === 0 || officeCount === 0}
          className="h-8 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          自動紐付け
        </button>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2">
        <label className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
          NW更改対象拠点 CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onTargetFileChange(file);
            }}
            className="mt-2 block w-full text-sm text-zinc-700"
          />
          <p className="mt-2 text-[11px] text-zinc-500">
            {loading === "target" ? "読み込み中..." : `${targetCount} 件読込済み`}
          </p>
        </label>

        <label className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
          回線業者拠点 CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onOfficeFileChange(file);
            }}
            className="mt-2 block w-full text-sm text-zinc-700"
          />
          <p className="mt-2 text-[11px] text-zinc-500">
            {loading === "office" ? "読み込み中..." : `${officeCount} 件読込済み`}
          </p>
        </label>
      </div>
      {issues.length > 0 && (
        <div className="border-t border-zinc-200 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-amber-700">CSV validation</p>
            <button
              type="button"
              onClick={onClearIssues}
              className="text-[11px] text-zinc-500 hover:text-zinc-700"
            >
              clear
            </button>
          </div>
          <div className="max-h-28 overflow-y-auto rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            {issues.map((issue, index) => (
              <p key={`${issue.row}-${index}`}>row {issue.row}: {issue.message}</p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
