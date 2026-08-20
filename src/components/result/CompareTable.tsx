import { Card } from "@/components/ui/Card";
import { formatArea, formatCount, formatManwon, formatPricePerArea, formatYear } from "@/lib/format";
import type { DistrictRecommendation } from "@/lib/recommendation/types";

const ROWS: { label: string; get: (r: DistrictRecommendation) => string }[] = [
  { label: "적합도", get: (r) => r.totalScore.toFixed(1) },
  { label: "예산 이내 중앙 거래가격", get: (r) => formatManwon(r.stats.medianAffordablePrice) },
  { label: "㎡당 가격", get: (r) => formatPricePerArea(r.stats.medianAffordablePricePerArea) },
  { label: "예산 이내 중앙면적", get: (r) => formatArea(r.stats.medianAffordableArea) },
  { label: "중앙 건물연식", get: (r) => formatYear(r.stats.medianAge) },
  { label: "예산 이내 거래건수", get: (r) => `${formatCount(r.stats.affordableCount)}건` },
  { label: "가격 변동계수(CV)", get: (r) => r.stats.priceVolatility.toFixed(2) },
];

export function CompareTable({ districts }: { districts: DistrictRecommendation[] }) {
  if (districts.length === 0) return null;

  return (
    <Card>
      <h3 className="mb-4 text-lg font-bold text-navy">지역 비교</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-slate-500">
              <th className="py-2 pr-4 font-medium">항목</th>
              {districts.map((d) => (
                <th key={d.district} className="py-2 pr-4 font-semibold text-navy">
                  {d.district}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-0">
                <td className="py-2.5 pr-4 text-slate-500">{row.label}</td>
                {districts.map((d) => (
                  <td key={d.district} className="py-2.5 pr-4 font-medium tabular-nums text-navy">
                    {row.get(d)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
