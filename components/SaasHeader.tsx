import { StatusBadge } from "@/components/StatusBadge";
import type { PlanStatus } from "@/lib/demo-ui";

export function SaasHeader({
  projectName,
  workspaceName,
  userName,
  status,
}: {
  projectName: string;
  workspaceName: string;
  userName: string;
  status: PlanStatus;
}) {
  return (
    <div className="border-b border-zinc-200 bg-white px-6 py-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">{workspaceName}</p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-950">{projectName}</h2>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
            <span>Owner: {userName}</span>
            <span>Scenario planning</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-medium uppercase text-zinc-500">Plan status</p>
            <p className="mt-1 text-sm text-zinc-600">
              {status === "Generated" ? "Latest run available" : status === "Ready" ? "Ready to simulate" : "Draft setup"}
            </p>
          </div>
            <StatusBadge status={status} />
        </div>
      </div>
    </div>
  );
}
