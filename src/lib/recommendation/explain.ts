import { median } from "../realestate/derive";
import { subjectParticle } from "./korean";
import type { DistrictStats } from "./score";
import type { DistrictScoreBreakdown, NormalizedWeights, ScoreKey, UserPreferences } from "./types";

const DIMENSION_LABEL: Record<ScoreKey, string> = {
  price: "예산 적합도",
  space: "공간 효율",
  newness: "신축 적합도",
  district: "지역 적합도",
  buildingType: "주택유형 적합도",
  floor: "층 적합도",
  stability: "시장 안정성",
  liquidity: "거래 활성도",
};

// 강점/약점 판정 임계값. 점수는 이미 percentile-clip 정규화된 0~100 스케일이므로
// (score.ts 참고) 다시 지역 간 상대비교를 하지 않고 절대 임계값을 쓴다.
// 65 이상=상대적 강점, 40 이하=상대적 약점으로 설정 — 정규화 방식(p5~p95 clip)상
// 대체로 중간 지역들이 30~70 사이에 몰리므로 이 구간을 "중립"으로 남겨둔다.
const STRENGTH_THRESHOLD = 65;
const WEAKNESS_THRESHOLD = 40;

function fmtManwon(v: number): string {
  const eok = v / 10000;
  return `${eok.toFixed(1)}억원`;
}

function fmtPct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function reasonSentence(key: ScoreKey, stats: DistrictStats, prefs: UserPreferences): string | null {
  switch (key) {
    case "price":
      if (stats.affordableCount === 0) return null;
      return `예산(${fmtManwon(prefs.budget)}) 이내 거래가 ${stats.affordableCount}건으로, 이 지역 전체 거래의 ${fmtPct(stats.affordableRatio)}가 예산 범위 안에 있습니다.`;
    case "space":
      if (!Number.isFinite(stats.medianAffordableArea)) return null;
      return `동일 예산 기준 확보 가능한 중앙 면적이 ${stats.medianAffordableArea.toFixed(1)}㎡입니다.`;
    case "newness":
      if (stats.newRatio !== null) {
        return `희망하신 연식 조건(${prefs.maxBuildingAge}년 이하)을 만족하는 예산 이내 거래 비율이 ${fmtPct(stats.newRatio)}입니다.`;
      }
      if (stats.medianAffordableAge !== null) {
        return `예산 이내 거래의 중앙 건물연식은 ${stats.medianAffordableAge}년입니다.`;
      }
      return null;
    case "district":
      if (stats.districtMatch === 1) return `사용자가 직접 지정한 희망 지역에 포함됩니다.`;
      return null;
    case "buildingType":
      if (stats.typeMatchRatio !== null) {
        return `예산 이내 거래 중 희망 주택유형 비율이 ${fmtPct(stats.typeMatchRatio)}입니다.`;
      }
      return null;
    case "floor":
      if (stats.floorMatchRatio !== null) {
        return `층 정보가 있는 예산 이내 거래 중 희망 층대(${prefs.floorPreference}) 비율이 ${fmtPct(stats.floorMatchRatio)}입니다.`;
      }
      return null;
    case "stability":
      return `최근 ${stats.yearlyMedianPricePerArea.length}개년 ㎡당가격 변동계수가 ${stats.priceVolatilityCV.toFixed(2)}입니다 (낮을수록 안정적).`;
    case "liquidity": {
      const latest = stats.yearlyMedianPricePerArea[stats.yearlyMedianPricePerArea.length - 1];
      return `최근 연도(${latest?.year ?? ""}) 거래건수가 ${stats.recentYearCount}건입니다.`;
    }
    default:
      return null;
  }
}

function tradeoffSentences(stats: DistrictStats, prefs: UserPreferences): string[] {
  const out: string[] = [];

  if (prefs.maxBuildingAge !== undefined && stats.newRatio !== null && stats.affordableCount > 0) {
    if (stats.newRatio < 0.3) {
      out.push(
        `건축 ${prefs.maxBuildingAge}년 이하 조건을 유지하면 예산 이내 거래 중 ${fmtPct(stats.newRatio)}만 조건을 충족해 선택지가 제한적입니다.`,
      );
    }
  }

  if (prefs.minArea !== undefined && stats.affordableCount > 0) {
    const ratio = stats.matchingCount / stats.affordableCount;
    if (ratio < 0.5) {
      out.push(
        `최소 면적 ${prefs.minArea}㎡ 조건까지 반영하면 실제 조건에 맞는 거래는 ${stats.matchingCount}건(예산 이내의 ${fmtPct(ratio)})으로 줄어듭니다.`,
      );
    }
  }

  if (prefs.preferredBuildingTypes && prefs.preferredBuildingTypes.length > 0 && stats.typeMatchRatio !== null) {
    if (stats.typeMatchRatio < 0.3) {
      out.push(
        `희망 주택유형(${prefs.preferredBuildingTypes.join("/")})만 고수하면 예산 이내 거래의 ${fmtPct(stats.typeMatchRatio)}만 남습니다.`,
      );
    }
  }

  if (stats.priceVolatilityCV > 0.15) {
    out.push(
      `최근 3개년 ㎡당가격 변동계수가 ${stats.priceVolatilityCV.toFixed(2)}로 비교적 변동이 큰 지역입니다.`,
    );
  }

  return out;
}

export function explainDistrict(
  stats: DistrictStats,
  scores: DistrictScoreBreakdown,
  normalizedWeights: NormalizedWeights,
  prefs: UserPreferences,
): { strengths: string[]; weaknesses: string[]; tradeoffs: string[]; reasons: string[] } {
  const entries = (Object.keys(scores) as ScoreKey[]).map((key) => ({
    key,
    score: scores[key],
    weight: normalizedWeights[key],
    contribution: scores[key] * normalizedWeights[key],
  }));

  const strengths = entries
    .filter((e) => e.score >= STRENGTH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((e) => {
      const sentence = reasonSentence(e.key, stats, prefs);
      return sentence ? `[${DIMENSION_LABEL[e.key]}] ${sentence}` : null;
    })
    .filter((s): s is string => s !== null);

  const weaknesses = entries
    .filter((e) => e.score <= WEAKNESS_THRESHOLD)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((e) => {
      const label = DIMENSION_LABEL[e.key];
      return `${label}${subjectParticle(label)} 상대적으로 낮습니다 (${e.score.toFixed(0)}점).`;
    });

  // reasons: 사용자가 실제로 가중치를 준(weight > 5%) 항목 중 기여도가 높은 순
  const reasons = entries
    .filter((e) => e.weight > 0.05)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)
    .map((e) => reasonSentence(e.key, stats, prefs))
    .filter((s): s is string => s !== null);

  const tradeoffs = tradeoffSentences(stats, prefs);

  return { strengths, weaknesses, tradeoffs, reasons };
}

/** marketContext 등에 쓰는 도시 전체 중앙값 (참고용, 임의 지역 비교 문구 생성에 사용 가능) */
export function cityMedianAffordableArea(allStats: DistrictStats[]): number {
  const values = allStats.map((s) => s.medianAffordableArea).filter((v) => Number.isFinite(v));
  return values.length > 0 ? median([...values].sort((a, b) => a - b)) : NaN;
}
