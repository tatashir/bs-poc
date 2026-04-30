type Props = {
  summary: {
    targetCount: number;
    officeCount: number;
    assignedCount: number;
    unassignedCount: number;
    highConfidenceCount: number;
    warningCount: number;
    manualOverrideCount: number;
  };
};

export function SummaryPanel({ summary }: Props) {
  const items = [
    ["Target sites", summary.targetCount],
    ["Carrier offices", summary.officeCount],
    ["Assigned", summary.assignedCount],
    ["Unassigned", summary.unassignedCount],
    ["High confidence", summary.highConfidenceCount],
    ["Warnings", summary.warningCount],
    ["Manual overrides", summary.manualOverrideCount],
  ];

  return (
    <section className="rounded-md border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-950">Summary</h2>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
            <p className="text-[11px] text-zinc-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-zinc-950">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
