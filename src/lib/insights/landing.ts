import "server-only";
import { getBuildingTypeSummary, getYearSummary } from "@/lib/realestate/data";
import { recommend } from "@/lib/recommendation/recommend";

/** Landing "Data Trust" 섹션 — 사전 집계된 작은 JSON만 읽고, 25.7MB 원자료는 건드리지 않는다 */
export function getDataTrustStats() {
  const yearSummary = getYearSummary().filter((y) => y.type === "전체");
  const transactionCount = yearSummary.reduce((sum, y) => sum + y.count, 0);
  const years = yearSummary.map((y) => y.year).sort((a, b) => a - b);
  return {
    years,
    transactionCount,
    districtCount: 25, // data/raw 전수 검증 완료 (DATA_ANALYSIS.md §4)
  };
}

/**
 * Landing CARD 1 예시 수치: 동일 예산에서 지역 간 확보 가능 면적 차이가 가장 큰 두 지역.
 * recommend()를 중립 가중치로 호출해 이미 계산된 지역별 stats(medianAffordableArea)를
 * 그대로 재사용한다 — 별도 임의 수치를 만들지 않는다.
 */
export function getBudgetAreaSpreadExample(budgetManwon: number) {
  const result = recommend({ budget: budgetManwon, weights: {} });
  const all = [...result.recommendations, ...result.alternatives].filter(
    (r) => r.confidence !== "insufficient",
  );
  if (all.length === 0) return null;

  const sorted = [...all].sort((a, b) => b.stats.medianAffordableArea - a.stats.medianAffordableArea);
  const widest = sorted[0];
  const narrowest = sorted[sorted.length - 1];
  return { budgetManwon, widest, narrowest };
}

/**
 * Landing CARD 2 예시 수치: 아파트 기준 신축(5년 이하) vs 구축(16~30년) ㎡당가격 프리미엄.
 * building-type-summary.json (Phase 2 산출물)에서 그대로 읽는다.
 */
export function getNewnessPremiumExample() {
  const summary = getBuildingTypeSummary();
  const apt = summary.filter((s) => s.type === "아파트");
  const fresh = apt.find((s) => s.ageBucket === "신축(5년 이하)");
  const old = apt.find((s) => s.ageBucket === "구축(16~30년)");
  if (!fresh || !old || old.medianPricePerArea === 0) return null;
  const premiumPct = ((fresh.medianPricePerArea - old.medianPricePerArea) / old.medianPricePerArea) * 100;
  return { fresh, old, premiumPct };
}
