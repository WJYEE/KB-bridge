import type { ScoreWeights } from "./types";

export interface PersonaPreset {
  id: string;
  label: string;
  description: string;
  weights: Partial<ScoreWeights>;
}

/**
 * Persona 프리셋의 가중치는 기획 문서(Phase 3 §12)에 명시된 숫자를 그대로 쓴다.
 * 언급되지 않은 차원(예: buildingType/floor/liquidity)은 0으로 두고, 사용자가
 * /assessment 에서 프리셋 선택 후 직접 조정할 수 있게 한다 (normalizeWeights가
 * 합계와 무관하게 비율로 정규화하므로 그대로 둬도 안전하다).
 */
export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    id: "price-first",
    label: "가격 우선형",
    description: "예산 안에서 선택지가 충분한 지역을 최우선으로 봅니다.",
    weights: { price: 55, space: 25, stability: 20 },
  },
  {
    id: "space-first",
    label: "공간 우선형",
    description: "같은 예산이라면 넓은 면적을 최우선으로 봅니다.",
    weights: { space: 50, price: 30, newness: 20 },
  },
  {
    id: "newness-first",
    label: "신축 우선형",
    description: "건물연식이 짧은 신축·준신축을 최우선으로 봅니다.",
    weights: { newness: 50, price: 30, space: 20 },
  },
  {
    id: "district-first",
    label: "지역 우선형",
    description: "희망 지역을 벗어나지 않는 것을 최우선으로 하고, 나머지 조건은 균형 있게 봅니다.",
    // "지역 필터를 강하게" → district 가중치를 나머지 항목 중 최댓값(price 40)보다 높게 설정
    weights: { district: 45, price: 40, space: 30, newness: 20, stability: 10 },
  },
  {
    id: "balanced",
    label: "균형형",
    description: "가격·공간·신축·지역·유형·층·안정성·유동성을 고르게 반영합니다.",
    weights: {
      price: 12.5,
      space: 12.5,
      newness: 12.5,
      district: 12.5,
      buildingType: 12.5,
      floor: 12.5,
      stability: 12.5,
      liquidity: 12.5,
    },
  },
];

export function getPreset(id: string): PersonaPreset | undefined {
  return PERSONA_PRESETS.find((p) => p.id === id);
}
