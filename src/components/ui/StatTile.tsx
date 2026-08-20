import { cn } from "@/lib/cn";

const TONE = {
  default: { value: "text-navy", label: "text-slate-600", sub: "text-slate-500" },
  inverted: { value: "text-white", label: "text-blue-200", sub: "text-blue-300" },
} as const;

/** lg: 랜딩 Data Trust처럼 짧은 값(숫자 몇 자리) 전용. md: 금액·단위가 붙어 길어지는 값(금융 결과 등) */
const SIZE = {
  lg: "text-3xl sm:text-4xl",
  md: "text-2xl sm:text-3xl",
} as const;

export function StatTile({
  value,
  label,
  sub,
  tone = "default",
  size = "lg",
  className,
}: {
  value: string;
  label: string;
  sub?: string;
  tone?: keyof typeof TONE;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className={cn("font-bold tracking-tight break-keep", SIZE[size], t.value)}>{value}</span>
      <span className={cn("text-sm font-medium", t.label)}>{label}</span>
      {sub && <span className={cn("text-xs", t.sub)}>{sub}</span>}
    </div>
  );
}
