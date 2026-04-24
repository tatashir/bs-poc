import type { PlanStatus } from "@/lib/demo-ui";

export function StatusBadge({ status }: { status: PlanStatus }) {
  const classes =
    status === "Generated"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : status === "Ready"
        ? "border-zinc-300 bg-white text-zinc-800"
        : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>
      {status}
    </span>
  );
}
