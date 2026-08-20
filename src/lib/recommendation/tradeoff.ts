import { getFloorBucket, median } from "../realestate/derive";
import { getTransactions } from "../realestate/data";
import type { Transaction } from "../realestate/types";
import type { UserPreferences } from "./types";

export interface TradeoffSnapshot {
  matchingCount: number;
  /** 해당 조건을 만족하는 거래가 1건 이상 있는 자치구 수 (25개 중) */
  districtsWithMatches: number;
  medianPrice: number | null; // 만원
  medianArea: number | null; // ㎡
  medianAge: number | null; // 년
  medianPricePerArea: number | null; // 만원/㎡
}

export interface TradeoffResult {
  base: TradeoffSnapshot;
  changed: TradeoffSnapshot;
  delta: {
    matchingCount: number;
    districtsWithMatches: number;
    medianPrice: number | null;
    medianArea: number | null;
    medianAge: number | null;
  };
  /** 실제 계산된 delta에 근거한 문장만 생성한다 (조건 변화가 없으면 빈 배열) */
  summary: string[];
}

/** 조건(prefs)에 맞는 거래만 남긴다. recommend.ts의 matchingCount 계산과 동일한 필터 로직 */
export function filterTransactions(prefs: UserPreferences, transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => {
    if (t.price > prefs.budget) return false;
    if (prefs.minArea !== undefined && t.area < prefs.minArea) return false;
    if (prefs.maxBuildingAge !== undefined) {
      if (t.age === null || t.age > prefs.maxBuildingAge) return false;
    }
    if (prefs.preferredDistricts && prefs.preferredDistricts.length > 0) {
      if (!prefs.preferredDistricts.includes(t.district)) return false;
    }
    if (prefs.preferredBuildingTypes && prefs.preferredBuildingTypes.length > 0) {
      if (!prefs.preferredBuildingTypes.includes(t.type)) return false;
    }
    if (prefs.floorPreference && prefs.floorPreference !== "무관") {
      if (t.floor === null || getFloorBucket(t.floor) !== prefs.floorPreference) return false;
    }
    return true;
  });
}

function snapshot(prefs: UserPreferences, transactions: Transaction[]): TradeoffSnapshot {
  const matching = filterTransactions(prefs, transactions);
  const districtsWithMatches = new Set(matching.map((t) => t.district)).size;

  const prices = matching.map((t) => t.price).sort((a, b) => a - b);
  const areas = matching.map((t) => t.area).sort((a, b) => a - b);
  const pricePerAreas = matching.map((t) => t.pricePerArea).sort((a, b) => a - b);
  const ages = matching
    .map((t) => t.age)
    .filter((a): a is number => a !== null)
    .sort((a, b) => a - b);

  return {
    matchingCount: matching.length,
    districtsWithMatches,
    medianPrice: prices.length > 0 ? Math.round(median(prices)) : null,
    medianArea: areas.length > 0 ? Math.round(median(areas) * 100) / 100 : null,
    medianAge: ages.length > 0 ? median(ages) : null,
    medianPricePerArea: pricePerAreas.length > 0 ? Math.round(median(pricePerAreas) * 10) / 10 : null,
  };
}

function summarize(base: TradeoffSnapshot, changed: TradeoffSnapshot): string[] {
  const lines: string[] = [];

  if (changed.districtsWithMatches !== base.districtsWithMatches) {
    lines.push(`선택 가능한 지역: ${base.districtsWithMatches}개 → ${changed.districtsWithMatches}개`);
  }
  if (changed.matchingCount !== base.matchingCount) {
    lines.push(`조건에 맞는 거래 건수: ${base.matchingCount}건 → ${changed.matchingCount}건`);
  }
  if (base.medianArea !== null && changed.medianArea !== null && base.medianArea !== changed.medianArea) {
    lines.push(`중앙 확보 면적: ${base.medianArea}㎡ → ${changed.medianArea}㎡`);
  }
  if (base.medianPrice !== null && changed.medianPrice !== null && base.medianPrice !== changed.medianPrice) {
    lines.push(
      `중앙 거래가격: ${(base.medianPrice / 10000).toFixed(1)}억원 → ${(changed.medianPrice / 10000).toFixed(1)}억원`,
    );
  }
  if (base.medianAge !== null && changed.medianAge !== null && base.medianAge !== changed.medianAge) {
    lines.push(`중앙 건물연식: ${base.medianAge}년 → ${changed.medianAge}년`);
  }
  if (
    base.medianPricePerArea !== null &&
    changed.medianPricePerArea !== null &&
    base.medianPricePerArea !== changed.medianPricePerArea
  ) {
    const pct = ((changed.medianPricePerArea - base.medianPricePerArea) / base.medianPricePerArea) * 100;
    lines.push(
      `㎡당가격: ${base.medianPricePerArea}만원 → ${changed.medianPricePerArea}만원 (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`,
    );
  }

  return lines;
}

/**
 * 조건 하나(또는 여러 개)를 바꿨을 때 실제 거래 데이터 기준으로 무엇이 달라지는지 계산한다.
 * base/changed는 완전한 UserPreferences 두 세트를 받는다 — 호출부에서 원하는 조건 하나만
 * 바꿔 넘기면 된다 (예: { ...base, maxBuildingAge: undefined } 로 신축 조건 완화).
 */
export function simulateTradeoff(base: UserPreferences, changed: UserPreferences): TradeoffResult {
  const allTx = getTransactions();
  const baseSnap = snapshot(base, allTx);
  const changedSnap = snapshot(changed, allTx);

  return {
    base: baseSnap,
    changed: changedSnap,
    delta: {
      matchingCount: changedSnap.matchingCount - baseSnap.matchingCount,
      districtsWithMatches: changedSnap.districtsWithMatches - baseSnap.districtsWithMatches,
      medianPrice:
        baseSnap.medianPrice !== null && changedSnap.medianPrice !== null
          ? changedSnap.medianPrice - baseSnap.medianPrice
          : null,
      medianArea:
        baseSnap.medianArea !== null && changedSnap.medianArea !== null
          ? Math.round((changedSnap.medianArea - baseSnap.medianArea) * 100) / 100
          : null,
      medianAge:
        baseSnap.medianAge !== null && changedSnap.medianAge !== null
          ? changedSnap.medianAge - baseSnap.medianAge
          : null,
    },
    summary: summarize(baseSnap, changedSnap),
  };
}

// --- 대표 Trade-off 시나리오 빌더 (기획 §14) ---
// 모두 simulateTradeoff(base, changed) 위에 얇게 얹은 헬퍼일 뿐, 실제 계산 로직은
// filterTransactions/snapshot 하나로 통일되어 있다.

/** 신축(연식) 조건을 완전히 해제했을 때 */
export function relaxNewnessCondition(base: UserPreferences): TradeoffResult {
  const changed: UserPreferences = { ...base };
  delete changed.maxBuildingAge;
  return simulateTradeoff(base, changed);
}

/** 희망 지역 고정을 풀고 서울 전체로 확장했을 때 */
export function relaxDistrictCondition(base: UserPreferences): TradeoffResult {
  return simulateTradeoff(base, { ...base, preferredDistricts: [] });
}

/** 주택유형을 확장했을 때 (예: 아파트만 -> 아파트+오피스텔+연립다세대) */
export function expandBuildingTypes(
  base: UserPreferences,
  expandedTypes: UserPreferences["preferredBuildingTypes"],
): TradeoffResult {
  return simulateTradeoff(base, { ...base, preferredBuildingTypes: expandedTypes });
}

/** 최소 면적 조건을 바꿨을 때 */
export function changeMinArea(base: UserPreferences, newMinArea: number | undefined): TradeoffResult {
  return simulateTradeoff(base, { ...base, minArea: newMinArea });
}

/** 예산을 바꿨을 때 */
export function changeBudget(base: UserPreferences, newBudget: number): TradeoffResult {
  return simulateTradeoff(base, { ...base, budget: newBudget });
}
