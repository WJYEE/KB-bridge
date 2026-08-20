import { median } from "../realestate/derive";
import { getTransactions, listDistricts, listYears } from "../realestate/data";
import type { Transaction } from "../realestate/types";
import { explainDistrict } from "./explain";
import { normalizeWeights } from "./normalize";
import { buildDistrictStats, scoreAllDimensions, type DistrictStats } from "./score";
import type { ConfidenceLevel, DistrictRecommendation, RecommendationResult, UserPreferences } from "./types";

/**
 * 신뢰도 표본수 기준.
 * 실제 데이터(2024~2026, 284,102건)에서 "예산+면적+연식+유형+층" 조건을 모두 건
 * 엄격한 시나리오를 테스트해본 결과, 조건에 따라 지역별 1~수십 건까지 편차가 컸다
 * (예: 2.5억/30㎡↑/10년↓/오피스텔 조건에서 강서구 27건 vs 강동구 1건, 9개 지역 0건).
 * 반면 예산만 건 완만한 시나리오는 최소 지역도 수백 건이었다.
 * 이를 근거로 "충분히 안정적인 중앙값" 기준을 표본통계에서 흔히 쓰는 30(대표본
 * 근사 기준), 그 아래 10을 "참고 가능하지만 변동성 큼"의 경계로 잡았다.
 * (DECISION_LOG.md 참고)
 */
const MIN_SAMPLE_HIGH_CONFIDENCE = 30;
const MIN_SAMPLE_MEDIUM_CONFIDENCE = 10;

function confidenceOf(sampleSize: number): ConfidenceLevel {
  if (sampleSize >= MIN_SAMPLE_HIGH_CONFIDENCE) return "high";
  if (sampleSize >= MIN_SAMPLE_MEDIUM_CONFIDENCE) return "medium";
  if (sampleSize > 0) return "low";
  return "insufficient";
}

function groupByDistrict(transactions: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (!map.has(t.district)) map.set(t.district, []);
    map.get(t.district)!.push(t);
  }
  return map;
}

export function recommend(prefs: UserPreferences): RecommendationResult {
  if (!Number.isFinite(prefs.budget) || prefs.budget <= 0) {
    throw new Error("budget은 0보다 큰 값이어야 합니다.");
  }

  const allTx = getTransactions();
  const dataYears = listYears();
  const districts = listDistricts();
  const byDistrict = groupByDistrict(allTx);
  const normalizedWeights = normalizeWeights(prefs.weights);

  const allStats: DistrictStats[] = districts.map((d) =>
    buildDistrictStats(d, byDistrict.get(d) ?? [], prefs, dataYears),
  );

  const districtRecs: DistrictRecommendation[] = allStats.map((stats) => {
    const scores = scoreAllDimensions(stats, allStats);
    const totalScore =
      scores.price * normalizedWeights.price +
      scores.space * normalizedWeights.space +
      scores.newness * normalizedWeights.newness +
      scores.district * normalizedWeights.district +
      scores.buildingType * normalizedWeights.buildingType +
      scores.floor * normalizedWeights.floor +
      scores.stability * normalizedWeights.stability +
      scores.liquidity * normalizedWeights.liquidity;

    const confidence = confidenceOf(stats.matchingCount);
    const { strengths, weaknesses, tradeoffs, reasons } = explainDistrict(
      stats,
      scores,
      normalizedWeights,
      prefs,
    );

    const latestVolatilityInputs = stats.yearlyMedianPricePerArea
      .filter((y) => Number.isFinite(y.value))
      .map((y) => y.value);

    const rec: DistrictRecommendation = {
      district: stats.district,
      totalScore: Math.round(totalScore * 10) / 10,
      scores,
      sampleSize: stats.matchingCount,
      confidence,
      stats: {
        affordableCount: stats.affordableCount,
        affordableRatio: Math.round(stats.affordableRatio * 1000) / 1000,
        medianAffordablePrice: Number.isFinite(stats.medianAffordablePrice)
          ? Math.round(stats.medianAffordablePrice)
          : 0,
        medianAffordableArea: Number.isFinite(stats.medianAffordableArea)
          ? Math.round(stats.medianAffordableArea * 100) / 100
          : 0,
        medianAffordablePricePerArea: Number.isFinite(stats.medianAffordablePricePerArea)
          ? Math.round(stats.medianAffordablePricePerArea * 10) / 10
          : 0,
        medianAge: stats.medianAffordableAge,
        priceVolatility:
          latestVolatilityInputs.length > 0 ? Math.round(stats.priceVolatilityCV * 1000) / 1000 : 0,
      },
      strengths,
      weaknesses,
      tradeoffs,
      reasons,
    };
    return rec;
  });

  districtRecs.sort((a, b) => b.totalScore - a.totalScore);

  const eligible = districtRecs.filter((r) => r.confidence !== "insufficient");
  const insufficient = districtRecs.filter((r) => r.confidence === "insufficient");

  const recommendations = eligible.slice(0, 5);
  const alternatives = [...eligible.slice(5), ...insufficient].sort(
    (a, b) => b.totalScore - a.totalScore,
  );

  const allPrices = allTx.map((t) => t.price).sort((a, b) => a - b);
  const allPricePerArea = allTx.map((t) => t.pricePerArea).sort((a, b) => a - b);

  return {
    profile: prefs,
    normalizedWeights,
    recommendations,
    alternatives,
    marketContext: {
      citywideMedianPrice: Math.round(median(allPrices)),
      citywideMedianPricePerArea: Math.round(median(allPricePerArea) * 10) / 10,
      dataYears,
    },
    meta: {
      transactionCount: allTx.length,
      dataYears,
      districtsEvaluated: districts.length,
      districtsWithInsufficientData: insufficient.length,
    },
  };
}
