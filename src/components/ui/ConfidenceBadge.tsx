import clsx from "clsx";
import type { ConfidenceLevel } from "@/lib/recommendation/types";

const CONFIG: Record<ConfidenceLevel, { label: string; className: string }> = {
  high: { label: "신뢰도 높음", className: "bg-good-bg text-good-text" },
  medium: { label: "신뢰도 보통", className: "bg-warn-bg text-warn-text" },
  low: { label: "신뢰도 낮음", className: "bg-warn-bg text-warn-text" },
  insufficient: { label: "데이터 부족", className: "bg-bad-bg text-bad-text" },
};

export function ConfidenceBadge({
  confidence,
  sampleSize,
}: {
  confidence: ConfidenceLevel;
  sampleSize: number;
}) {
  const cfg = CONFIG[confidence];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        cfg.className,
      )}
    >
      {cfg.label}
      {/* opacity로 흐리게 하면 대비가 다시 깨지므로 별도 톤 없이 같은 색을 유지한다 */}
      <span className="font-normal">· 표본 {sampleSize.toLocaleString("ko-KR")}건</span>
    </span>
  );
}
