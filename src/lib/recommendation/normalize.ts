import { percentile } from "../realestate/derive";
import { SCORE_KEYS, type NormalizedWeights, type ScoreWeights } from "./types";

/**
 * 사용자가 입력한 중요도 가중치(합이 100이 아니어도 됨, 음수는 0으로 clamp)를
 * 합=1로 정규화한다. 전부 0이거나 입력이 없으면 8개 항목 균등 가중치로 대체한다.
 */
export function normalizeWeights(weights: Partial<ScoreWeights>): NormalizedWeights {
  const raw = SCORE_KEYS.map((k) => Math.max(0, weights[k] ?? 0));
  const sum = raw.reduce((a, b) => a + b, 0);

  if (sum <= 0) {
    const equal = 1 / SCORE_KEYS.length;
    return Object.fromEntries(SCORE_KEYS.map((k) => [k, equal])) as NormalizedWeights;
  }

  return Object.fromEntries(SCORE_KEYS.map((k, i) => [k, raw[i] / sum])) as NormalizedWeights;
}

/**
 * Percentile-clipped min-max scaling: 0~100.
 *
 * 왜 순수 min-max가 아니라 percentile clipping인가 (DECISION_LOG 참고):
 * 25개 자치구의 중앙값을 비교 모집단으로 쓰는데, 강남·서초처럼 극단적으로 높은
 * 지역 1~2곳이 있으면 순수 min-max에서는 나머지 23개 지역이 0~30점 구간에
 * 몰려버려 사실상 변별력이 사라진다. p5~p95로 양끝을 잘라 스케일을 잡으면
 * 극단값의 영향은 줄이되(둘 다 near-min/near-max로 정확히 취급), 나머지
 * 지역 간 상대적 차이는 그대로 보존된다.
 *
 * @param invert true면 값이 클수록 낮은 점수 (예: 변동성, 연식)
 */
export function clippedMinMaxScore(
  value: number,
  comparisonValues: number[],
  options?: { invert?: boolean; lowerP?: number; upperP?: number },
): number {
  const lowerP = options?.lowerP ?? 0.05;
  const upperP = options?.upperP ?? 0.95;
  const sorted = [...comparisonValues].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);

  if (sorted.length === 0 || !Number.isFinite(value)) return 50;
  if (sorted.length === 1) return 50; // 비교 대상이 자기 자신뿐이면 판단 불가 -> 중립값

  const lo = percentile(sorted, lowerP);
  const hi = percentile(sorted, upperP);

  if (hi <= lo) return 50; // 모집단 값이 전부 같으면 변별력 없음 -> 중립값

  const clipped = Math.min(hi, Math.max(lo, value));
  let score = ((clipped - lo) / (hi - lo)) * 100;
  if (options?.invert) score = 100 - score;
  return Math.round(Math.min(100, Math.max(0, score)) * 10) / 10;
}

/**
 * Rank-percentile scaling: 비교 모집단 내에서의 순위를 0~100으로 변환.
 * 절대값 스케일이 아니라 "몇 %ile인가"만 보므로 클리핑보다도 극단값에 더 강건하다.
 * 거래 유동성처럼 표본 크기가 지역마다 매우 편차가 큰 지표(강서구 vs 용산구 등
 * 최대 8배 차이)에 적용해 특정 지역이 절대값으로 스케일을 지배하지 않게 한다.
 */
export function rankPercentileScore(value: number, comparisonValues: number[]): number {
  const sorted = [...comparisonValues].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length <= 1) return 50;
  let countBelow = 0;
  for (const v of sorted) {
    if (v < value) countBelow++;
  }
  const score = (countBelow / (sorted.length - 1)) * 100;
  return Math.round(score * 10) / 10;
}
