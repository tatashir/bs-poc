import type { AiSuggestion } from "@/lib/demo-ui";

const severityStyles = {
  info: "border-zinc-200 bg-zinc-50 text-zinc-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const;

export function AiInsightsPanel({
  title,
  subtitle,
  suggestions,
  emptyMessage,
  onApplySuggestion,
}: {
  title: string;
  subtitle: string;
  suggestions: AiSuggestion[];
  emptyMessage: string;
  onApplySuggestion?: (suggestion: AiSuggestion) => void;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="px-4 pt-4">
          <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
      </div>
      {suggestions.length === 0 ? (
        <div className="m-4 rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-3 divide-y divide-zinc-100 border-t border-zinc-100">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">{suggestion.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-zinc-600">{suggestion.message}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${severityStyles[suggestion.severity]}`}>
                  {suggestion.severity}
                </span>
              </div>
              {suggestion.actionLabel && onApplySuggestion && (
                <button
                  type="button"
                  onClick={() => onApplySuggestion(suggestion)}
                  className="mt-3 h-8 rounded-md border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                >
                  {suggestion.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
