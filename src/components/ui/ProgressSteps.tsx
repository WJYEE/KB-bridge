import clsx from "clsx";

export function ProgressSteps({
  total,
  current,
  labels,
}: {
  total: number;
  current: number; // 1-indexed
  labels: string[];
}) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>
          STEP {current} / {total}
        </span>
        <span className="text-navy">{labels[current - 1]}</span>
      </div>
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`입력 단계 진행률: ${labels[current - 1]} (${current}/${total}단계)`}
      >
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={clsx(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < current ? "bg-brand" : "bg-surface-alt",
            )}
          />
        ))}
      </div>
    </div>
  );
}
