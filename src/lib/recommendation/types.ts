import type { BuildingType } from "../realestate/types";

export type FloorPreference = "저층" | "중층" | "고층" | "무관";

/** 점수 차원 8종 (기획 Phase 3 지침 §1) */
export const SCORE_KEYS = [
  "price",
  "space",
  "newness",
  "district",
  "buildingType",
  "floor",
  "stability",
  "liquidity",
] as const;

export type ScoreKey = (typeof SCORE_KEYS)[number];

export type ScoreWeights = Record<ScoreKey, number>;

/** 사용자가 /assessment 에서 입력하는 원본 선호 (UI 레이어와 공유하는 계약) */
export interface UserPreferences {
  /** 최대 구매 예산 (만원) */
  budget: number;
  /** 보유 현금 = 자기자본 (만원). 추천 스코어링에는 쓰지 않고 /finance 로 그대로 전달 */
  cash?: number;
  /** 최소 희망 면적 (㎡). 없으면 면적 하한을 적용하지 않음 */
  minArea?: number;
  /** 희망 최대 건물연식 (년). 없으면 신축 조건을 적용하지 않고, newnessScore는 weight로만 반영 */
  maxBuildingAge?: number;
  /** 희망 자치구 (빈 배열/undefined = 전체 지역 무관) */
  preferredDistricts?: string[];
  /** 선호 주택유형 (빈 배열/undefined = 유형 무관) */
  preferredBuildingTypes?: BuildingType[];
  floorPreference?: FloorPreference;
  weights: Partial<ScoreWeights>;
}

/** 정규화된(합=1) 가중치 */
export type NormalizedWeights = ScoreWeights;

export interface DistrictScoreBreakdown {
  price: number;
  space: number;
  newness: number;
  district: number;
  buildingType: number;
  floor: number;
  stability: number;
  liquidity: number;
}

export type ConfidenceLevel = "high" | "medium" | "low" | "insufficient";

export interface DistrictRecommendation {
  district: string;
  totalScore: number; // 0~100
  scores: DistrictScoreBreakdown;
  /** 조건(예산/면적/연식/유형/층)을 모두 만족하는 실제 거래 건수 */
  sampleSize: number;
  confidence: ConfidenceLevel;
  /** 참고 통계 (설명 생성 및 UI 표시에 사용, 임의 문구 아님) */
  stats: {
    affordableCount: number; // 예산 이하 거래 수
    affordableRatio: number; // 예산 이하 거래 비율 (0~1)
    medianAffordablePrice: number; // 예산 이하 거래 중앙값 가격(만원)
    medianAffordableArea: number; // 예산 이하 거래 중앙값 면적(㎡)
    medianAffordablePricePerArea: number; // 만원/㎡
    medianAge: number | null; // 예산 이하 거래 중앙값 연식(년)
    priceVolatility: number; // 3개년 ㎡당가격 중앙값의 변동계수(CV)
  };
  strengths: string[];
  weaknesses: string[];
  tradeoffs: string[];
  reasons: string[];
}

export interface RecommendationResult {
  profile: UserPreferences;
  normalizedWeights: NormalizedWeights;
  recommendations: DistrictRecommendation[]; // 최대 5개 (신뢰 가능한 지역 중 상위)
  alternatives: DistrictRecommendation[]; // top5 밖의 나머지 (참고용)
  marketContext: {
    citywideMedianPrice: number;
    citywideMedianPricePerArea: number;
    dataYears: number[];
  };
  meta: {
    transactionCount: number;
    dataYears: number[];
    districtsEvaluated: number;
    districtsWithInsufficientData: number;
  };
}
