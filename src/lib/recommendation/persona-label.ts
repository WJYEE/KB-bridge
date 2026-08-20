import type { NormalizedWeights, ScoreKey } from "./types";

const LABEL: Record<ScoreKey, string> = {
  price: "가격",
  space: "공간",
  newness: "신축",
  district: "지역",
  buildingType: "주택유형",
  floor: "층",
  stability: "시장 안정성",
  liquidity: "거래 활성도",
};

const PERSONA_BY_KEY: Partial<Record<ScoreKey, string>> = {
  price: "가격 우선형",
  space: "공간 우선형",
  newness: "신축 우선형",
  district: "지역 우선형",
};

export interface PersonaLabel {
  label: string;
  topDimensions: { key: ScoreKey; weight: number }[];
  description: string;
}

/**
 * 사용자의 정규화된 가중치(합=1)에서 가장 비중이 큰 차원을 근거로 "당신은 OO형에
 * 가깝습니다" 문구를 만든다. 프리셋을 선택했는지 여부와 무관하게, 최종적으로
 * 저장된 실제 가중치 숫자만 보고 판정한다 — 프리셋 선택 후 슬라이더를 직접
 * 수정한 사용자도 실제 입력값 기준으로 정확히 분류되도록 하기 위함이다.
 * 최댓값이 균등 가중치(1/8=12.5%)보다 크게 튀지 않으면(상위 항목 간 차이가 5%p
 * 미만) "균형형"으로 판정한다.
 */
export function classifyPersonaLabel(weights: NormalizedWeights): PersonaLabel {
  const entries = (Object.entries(weights) as [ScoreKey, number][]).sort((a, b) => b[1] - a[1]);
  const [topKey, topWeight] = entries[0];
  const [, secondWeight] = entries[1];

  const topDimensions = entries.slice(0, 2).map(([key, weight]) => ({ key, weight }));

  if (topWeight - secondWeight < 0.05) {
    return {
      label: "균형형",
      topDimensions,
      description: `입력하신 조건에서 여러 항목을 비교적 고르게 중요하게 반영했습니다 (1순위 ${LABEL[topKey]} ${Math.round(topWeight * 100)}%).`,
    };
  }

  const persona = PERSONA_BY_KEY[topKey] ?? `${LABEL[topKey]} 우선형`;
  const secondLabel = LABEL[entries[1][0]];
  return {
    label: persona,
    topDimensions,
    description: `입력한 조건에서 ${LABEL[topKey]}(${Math.round(topWeight * 100)}%)과 ${secondLabel}(${Math.round(secondWeight * 100)}%)을 가장 중요하게 반영했습니다.`,
  };
}
