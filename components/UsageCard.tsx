import type { UsageStats } from "@/lib/demo-ui";

function UsageMeter({ value, limit }: { value: number; limit: number }) {
  const ratio = Math.min(100, Math.round((value / Math.max(1, limit)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-500">
        <span>
          {value} / {limit}
        </span>
        <span>{ratio}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-zinc-100">
        <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${ratio}%` }} />
      </div>
    </div>
  );
}

export function UsageCard({
  usage,
  onUpgrade,
}: {
  usage: UsageStats;
  onUpgrade: () => void;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Usage</h2>
          <p className="mt-1 text-sm text-zinc-500">Workspace limits</p>
        </div>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700">{usage.planLabel}</span>
      </div>
      <div className="mt-4 grid gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-700">Simulations</p>
          <UsageMeter value={usage.simulationsUsed} limit={usage.simulationsLimit} />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-700">Sites analyzed</p>
          <UsageMeter value={usage.sitesAnalyzed} limit={usage.sitesLimit} />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-700">Plan reviews</p>
          <UsageMeter value={usage.aiInsightsUsed} limit={usage.aiInsightsLimit} />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-700">Team members</p>
          <UsageMeter value={usage.teamMembersUsed} limit={usage.teamMembersLimit} />
        </div>
      </div>
      <button
        type="button"
        onClick={onUpgrade}
        className="mt-5 h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
      >
        Manage plan
      </button>
    </div>
  );
}
