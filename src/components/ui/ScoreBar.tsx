export function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-sm text-slate-600">{label}</span>
      <div
        className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-alt"
        role="img"
        aria-label={`${label} ${Math.round(value)}점 (100점 만점)`}
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-sm font-semibold tabular-nums text-navy">
        {Math.round(value)}
      </span>
    </div>
  );
}
