import type { TeamMember } from "@/lib/demo-ui";

const roleStyles = {
  Owner: "border-zinc-900 bg-zinc-900 text-white",
  Admin: "border-blue-200 bg-blue-50 text-blue-700",
  Member: "border-zinc-200 bg-white text-zinc-700",
  Viewer: "border-zinc-200 bg-zinc-50 text-zinc-600",
} as const;

export function TeamMembersCard({
  members,
  onInvite,
}: {
  members: TeamMember[];
  onInvite: () => void;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Team</h2>
          <p className="mt-1 text-sm text-zinc-500">Access roles</p>
        </div>
        <button
          type="button"
          onClick={onInvite}
          className="h-8 rounded-md border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Invite
        </button>
      </div>
      <div className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-950">{member.name}</p>
              <p className="mt-1 text-xs text-zinc-500">{member.title}</p>
            </div>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${roleStyles[member.role]}`}>{member.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
