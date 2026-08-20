"use server";

/**
 * 서버 액션: 추천 계산은 반드시 서버에서 실행하고, 클라이언트에는 결과 객체만
 * 전달한다 (기획 §30). transactions.json(25.7MB)은 여기서만 로드된다.
 */
import { recommend } from "@/lib/recommendation/recommend";
import { simulateTradeoff } from "@/lib/recommendation/tradeoff";
import type { RecommendationResult, UserPreferences } from "@/lib/recommendation/types";
import type { TradeoffResult } from "@/lib/recommendation/tradeoff";

export async function runRecommendation(prefs: UserPreferences): Promise<RecommendationResult> {
  return recommend(prefs);
}

export async function runTradeoff(
  base: UserPreferences,
  changed: UserPreferences,
): Promise<TradeoffResult> {
  return simulateTradeoff(base, changed);
}
