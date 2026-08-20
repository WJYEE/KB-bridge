export function DeltaStat({
  label,
  from,
  to,
  deltaLabel,
}: {
  label: string;
  from: string;
  to: string;
  /** "+38,157건"처럼 실제 변화량을 그대로 표기한 문자열. 증감의 좋고 나쁨은 판단하지 않는다. */
  deltaLabel?: string | null;
}) {
  const changed = from !== to;
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-white p-4">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex flex-wrap items-baseline gap-2 text-base font-semibold text-navy">
        <span className={changed ? "text-slate-500 line-through decoration-1" : ""}>{from}</span>
        {changed && (
          <>
            <span className="text-slate-300">→</span>
            <span className="text-navy">{to}</span>
          </>
        )}
      </div>
      {changed && deltaLabel && <span className="text-sm font-medium tabular-nums text-brand">{deltaLabel}</span>}
    </div>
  );
}
