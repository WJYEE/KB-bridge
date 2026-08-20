export function WeightSlider({
  label,
  value,
  onChange,
  sharePercent,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** 8개 항목 정규화 후 실제 비중(%) — "총합은 자동으로 조정됩니다" 안내용 */
  sharePercent: number;
}) {
  const id = `weight-${label.replace(/\s+/g, "-")}`;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-medium text-navy">
          {label}
        </label>
        <span className="tabular-nums text-slate-500">{sharePercent}%</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-alt accent-brand"
        aria-valuetext={`${sharePercent}%`}
      />
    </div>
  );
}
