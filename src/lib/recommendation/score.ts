import {
  coefficientOfVariation,
  getFloorBucket,
  median,
} from "../realestate/derive";
import type { Transaction } from "../realestate/types";
import { clippedMinMaxScore, rankPercentileScore } from "./normalize";
import type { DistrictScoreBreakdown, FloorPreference, UserPreferences } from "./types";

/**
 * 지역 하나에 대해 점수 계산에 필요한 모든 원자료를 미리 뽑아둔 중간 구조체.
 * score.ts의 각 scoreXxx 함수와 explain.ts가 공통으로 참조한다 — 같은 숫자를
 * 두 번 다른 방식으로 계산해 결과가 어긋나는 일을 막기 위함이다.
 */
export interface DistrictStats {
  district: string;
  totalCount: number;

  affordableTx: Transaction[]; // price <= budget
  affordableCount: number;
  affordableRatio: number; // affordableCount / totalCount

  medianAffordablePrice: number;
  medianAffordableArea: number;
  medianAffordablePricePerArea: number;
  medianAffordableAge: number | null;

  budgetHeadroomRatio: number; // (budget - medianAffordablePrice) / budget, 0~1로 clamp

  /** 예산 이하 거래 중 희망 연식 조건(maxBuildingAge)을 만족하는 비율. 조건 없으면 null */
  newRatio: number | null;
  /** 예산 이하 거래 중 희망 지역에 해당하는지 (0/1). 무관이면 null */
  districtMatch: 0 | 1 | null;
  /** 예산 이하 거래 중 희망 주택유형 비율. 무관이면 null */
  typeMatchRatio: number | null;
  /** 예산 이하 거래(층 정보 있는 것) 중 희망 층대 비율. 무관/데이터없음이면 null */
  floorMatchRatio: number | null;

  yearlyMedianPricePerArea: { year: number; value: number; count: number }[];
  priceVolatilityCV: number;

  recentYearCount: number; // 데이터 상 가장 최근 연도의 거래 건수

  /** 예산+면적+연식+유형+층 조건을 모두 만족하는 거래 수 (신뢰도 판단용) */
  matchingCount: number;
}

export function buildDistrictStats(
  district: string,
  allDistrictTx: Transaction[],
  prefs: UserPreferences,
  dataYears: number[],
): DistrictStats {
  const totalCount = allDistrictTx.length;
  const affordableTx = allDistrictTx.filter((t) => t.price <= prefs.budget);
  const affordableCount = affordableTx.length;
  const affordableRatio = totalCount > 0 ? affordableCount / totalCount : 0;

  const sortedPrices = affordableTx.map((t) => t.price).sort((a, b) => a - b);
  const sortedAreas = affordableTx.map((t) => t.area).sort((a, b) => a - b);
  const sortedPricePerArea = affordableTx.map((t) => t.pricePerArea).sort((a, b) => a - b);
  const ages = affordableTx
    .map((t) => t.age)
    .filter((a): a is number => a !== null)
    .sort((a, b) => a - b);

  const medianAffordablePrice = affordableCount > 0 ? median(sortedPrices) : NaN;
  const medianAffordableArea = affordableCount > 0 ? median(sortedAreas) : NaN;
  const medianAffordablePricePerArea = affordableCount > 0 ? median(sortedPricePerArea) : NaN;
  const medianAffordableAge = ages.length > 0 ? median(ages) : null;

  const budgetHeadroomRatio =
    affordableCount > 0
      ? Math.max(0, Math.min(1, (prefs.budget - medianAffordablePrice) / prefs.budget))
      : 0;

  // --- 신축 적합도 원자료 ---
  let newRatio: number | null = null;
  if (prefs.maxBuildingAge !== undefined) {
    const withAge = affordableTx.filter((t) => t.age !== null);
    newRatio =
      withAge.length > 0
        ? withAge.filter((t) => (t.age as number) <= prefs.maxBuildingAge!).length /
          withAge.length
        : 0;
  }

  // --- 지역 적합도 원자료 ---
  let districtMatch: 0 | 1 | null = null;
  if (prefs.preferredDistricts && prefs.preferredDistricts.length > 0) {
    districtMatch = prefs.preferredDistricts.includes(district) ? 1 : 0;
  }

  // --- 주택유형 적합도 원자료 ---
  let typeMatchRatio: number | null = null;
  if (prefs.preferredBuildingTypes && prefs.preferredBuildingTypes.length > 0) {
    typeMatchRatio =
      affordableCount > 0
        ? affordableTx.filter((t) => prefs.preferredBuildingTypes!.includes(t.type)).length /
          affordableCount
        : 0;
  }

  // --- 층 적합도 원자료 ---
  let floorMatchRatio: number | null = null;
  if (prefs.floorPreference && prefs.floorPreference !== "무관") {
    const withFloor = affordableTx.filter((t) => t.floor !== null);
    floorMatchRatio =
      withFloor.length > 0
        ? withFloor.filter((t) => getFloorBucket(t.floor as number) === prefs.floorPreference)
            .length / withFloor.length
        : 0;
  }

  // --- 시장 안정성 원자료: 연도별 ㎡당가격 중앙값 (예산과 무관, 지역 전체 시장) ---
  const yearlyMedianPricePerArea = dataYears.map((year) => {
    const yearTx = allDistrictTx.filter((t) => t.year === year);
    const sorted = yearTx.map((t) => t.pricePerArea).sort((a, b) => a - b);
    return { year, value: sorted.length > 0 ? median(sorted) : NaN, count: yearTx.length };
  });
  const validYearlyValues = yearlyMedianPricePerArea
    .filter((y) => Number.isFinite(y.value))
    .map((y) => y.value);
  const priceVolatilityCV = coefficientOfVariation(validYearlyValues);

  const latestYear = Math.max(...dataYears);
  const recentYearCount = allDistrictTx.filter((t) => t.year === latestYear).length;

  // --- 신뢰도 판단용 표본: 예산 + 면적 + 연식 + 유형 + 층 조건을 모두 만족하는 거래 ---
  const matchingCount = affordableTx.filter((t) => {
    if (prefs.minArea !== undefined && t.area < prefs.minArea) return false;
    if (prefs.maxBuildingAge !== undefined) {
      if (t.age === null || t.age > prefs.maxBuildingAge) return false;
    }
    if (prefs.preferredBuildingTypes && prefs.preferredBuildingTypes.length > 0) {
      if (!prefs.preferredBuildingTypes.includes(t.type)) return false;
    }
    if (prefs.floorPreference && prefs.floorPreference !== "무관") {
      if (t.floor === null || getFloorBucket(t.floor) !== prefs.floorPreference) return false;
    }
    return true;
  }).length;

  return {
    district,
    totalCount,
    affordableTx,
    affordableCount,
    affordableRatio,
    medianAffordablePrice,
    medianAffordableArea,
    medianAffordablePricePerArea,
    medianAffordableAge,
    budgetHeadroomRatio,
    newRatio,
    districtMatch,
    typeMatchRatio,
    floorMatchRatio,
    yearlyMedianPricePerArea,
    priceVolatilityCV,
    recentYearCount,
    matchingCount,
  };
}

/**
 * 가격 적합도: "싸다 = 100점"이 아니라 "예산 안에서 선택지가 얼마나 충분한가".
 * affordableRatio(지역 전체 거래 중 예산 이하 비율, 70%)와
 * budgetHeadroomRatio(예산 대비 여유, 30%)를 가중합한다.
 */
export function scorePrice(stats: DistrictStats, allStats: DistrictStats[]): number {
  const ratioScore = clippedMinMaxScore(
    stats.affordableRatio,
    allStats.map((s) => s.affordableRatio),
  );
  const headroomScore = clippedMinMaxScore(
    stats.budgetHeadroomRatio,
    allStats.map((s) => s.budgetHeadroomRatio),
  );
  return Math.round((ratioScore * 0.7 + headroomScore * 0.3) * 10) / 10;
}

/** 공간 효율: 예산 이하 거래의 중앙 면적이 클수록 높은 점수 */
export function scoreSpace(stats: DistrictStats, allStats: DistrictStats[]): number {
  if (stats.affordableCount === 0) return 0;
  return clippedMinMaxScore(
    stats.medianAffordableArea,
    allStats.map((s) => s.medianAffordableArea).filter((v) => Number.isFinite(v)),
  );
}

/**
 * 신축 적합도: 사용자가 희망 연식을 지정한 경우 "예산 이하 + 연식조건 충족 비율"을 사용.
 * 지정하지 않은 경우 지역 자체의 신축 비중(연식 낮을수록 유리)으로 대체하되,
 * 단순 평균연식이 아니라 중앙연식의 역순 스케일을 쓴다(§5 "단순 평균연식만 쓰지 않는다").
 */
export function scoreNewness(stats: DistrictStats, allStats: DistrictStats[]): number {
  if (stats.newRatio !== null) {
    return clippedMinMaxScore(
      stats.newRatio,
      allStats.map((s) => s.newRatio).filter((v): v is number => v !== null),
    );
  }
  if (stats.medianAffordableAge === null) return 50;
  return clippedMinMaxScore(
    stats.medianAffordableAge,
    allStats.map((s) => s.medianAffordableAge).filter((v): v is number => v !== null),
    { invert: true },
  );
}

/** 지역 적합도: 희망 지역 미지정이면 전 지역 중립(100), 지정 시 포함 여부(0/100) — MVP는 인접지역 미정의 */
export function scoreDistrict(stats: DistrictStats): number {
  if (stats.districtMatch === null) return 100;
  return stats.districtMatch === 1 ? 100 : 0;
}

/** 주택유형 적합도: 선호 유형 미지정이면 중립(100), 지정 시 예산 이하 거래 중 해당 유형 비율 */
export function scoreBuildingType(stats: DistrictStats, allStats: DistrictStats[]): number {
  if (stats.typeMatchRatio === null) return 100;
  return clippedMinMaxScore(
    stats.typeMatchRatio,
    allStats.map((s) => s.typeMatchRatio).filter((v): v is number => v !== null),
  );
}

/** 층 적합도: 선호 없으면 중립(100), 지정 시 저/중/고층 매칭 비율 */
export function scoreFloor(stats: DistrictStats, allStats: DistrictStats[]): number {
  if (stats.floorMatchRatio === null) return 100;
  return clippedMinMaxScore(
    stats.floorMatchRatio,
    allStats.map((s) => s.floorMatchRatio).filter((v): v is number => v !== null),
  );
}

/**
 * 시장 안정성: 최근 3개년 ㎡당가격 중앙값의 변동계수(CV)가 낮을수록 높은 점수.
 * 값이 오른 지역이든 내린 지역이든 "변동폭"만 보므로, 급등 지역에 무조건
 * 높은 점수를 주지 않는다 (§9 지침).
 */
export function scoreStability(stats: DistrictStats, allStats: DistrictStats[]): number {
  return clippedMinMaxScore(
    stats.priceVolatilityCV,
    allStats.map((s) => s.priceVolatilityCV),
    { invert: true },
  );
}

/**
 * 거래 유동성("실거래 활성도"): 절대 거래건수를 그대로 쓰면 면적이 넓은 자치구가
 * 항상 유리해지므로, 전체 거래건수와 최근연도 거래건수를 각각 25개 지역 내
 * 순위백분위(rank percentile)로 변환해 절반씩 반영한다.
 */
export function scoreLiquidity(stats: DistrictStats, allStats: DistrictStats[]): number {
  const totalScore = rankPercentileScore(
    stats.totalCount,
    allStats.map((s) => s.totalCount),
  );
  const recentScore = rankPercentileScore(
    stats.recentYearCount,
    allStats.map((s) => s.recentYearCount),
  );
  return Math.round((totalScore * 0.5 + recentScore * 0.5) * 10) / 10;
}

export function scoreAllDimensions(
  stats: DistrictStats,
  allStats: DistrictStats[],
): DistrictScoreBreakdown {
  return {
    price: scorePrice(stats, allStats),
    space: scoreSpace(stats, allStats),
    newness: scoreNewness(stats, allStats),
    district: scoreDistrict(stats),
    buildingType: scoreBuildingType(stats, allStats),
    floor: scoreFloor(stats, allStats),
    stability: scoreStability(stats, allStats),
    liquidity: scoreLiquidity(stats, allStats),
  };
}

export function floorPreferenceLabel(pref: FloorPreference | undefined): string {
  return pref ?? "무관";
}
