import { describe, expect, it } from "vitest";
import { recommend } from "../recommend";
import type { UserPreferences } from "../types";

/**
 * 이 테스트들은 mock 데이터가 아니라 data/processed/transactions.json
 * (npm run preprocess 로 생성된 실제 284,102건)을 그대로 사용한다.
 * "npm run preprocess"를 먼저 실행한 상태여야 통과한다.
 */

function checkInvariants(result: ReturnType<typeof recommend>) {
  expect(result.recommendations.length).toBeLessThanOrEqual(5);
  const all = [...result.recommendations, ...result.alternatives];
  for (const r of all) {
    expect(r.totalScore).toBeGreaterThanOrEqual(0);
    expect(r.totalScore).toBeLessThanOrEqual(100);
    for (const s of Object.values(r.scores)) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
    // confidence <-> sampleSize 정합성
    if (r.sampleSize >= 30) expect(r.confidence).toBe("high");
    else if (r.sampleSize >= 10) expect(r.confidence).toBe("medium");
    else if (r.sampleSize > 0) expect(r.confidence).toBe("low");
    else expect(r.confidence).toBe("insufficient");
  }
  // recommendations는 점수 내림차순 정렬
  for (let i = 1; i < result.recommendations.length; i++) {
    expect(result.recommendations[i - 1].totalScore).toBeGreaterThanOrEqual(
      result.recommendations[i].totalScore,
    );
  }
  // recommendations에는 insufficient 지역이 없어야 함
  for (const r of result.recommendations) {
    expect(r.confidence).not.toBe("insufficient");
  }
}

describe("recommend()", () => {
  it("Case A: 저예산 + 가격우선 — 결과가 나오고 불변식을 만족한다", () => {
    const prefs: UserPreferences = {
      budget: 15000, // 1.5억
      weights: { price: 70, space: 10, stability: 20 },
    };
    const result = recommend(prefs);
    checkInvariants(result);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.meta.transactionCount).toBeGreaterThan(0);
  });

  it("Case B: 동일예산 + 공간우선 — Case A와 가중치만 다르면 순위가 달라질 수 있다", () => {
    const budget = 15000;
    const priceFirst = recommend({ budget, weights: { price: 70, space: 10, stability: 20 } });
    const spaceFirst = recommend({ budget, weights: { space: 70, price: 10, newness: 20 } });
    checkInvariants(priceFirst);
    checkInvariants(spaceFirst);
    // 최소한 8개 점수 자체는 두 실행에서 동일해야 한다 (가중치만 다르고 원자료는 같으므로)
    const priceFirstTop = priceFirst.recommendations[0];
    const spaceFirstMatch = spaceFirst.recommendations.find((r) => r.district === priceFirstTop.district);
    if (spaceFirstMatch) {
      expect(spaceFirstMatch.scores.space).toBeCloseTo(priceFirstTop.scores.space, 5);
    }
  });

  it("Case C: 신축우선 — maxBuildingAge 조건이 있어도 정상 동작한다", () => {
    const prefs: UserPreferences = {
      budget: 40000,
      maxBuildingAge: 10,
      weights: { newness: 60, price: 20, space: 20 },
    };
    const result = recommend(prefs);
    checkInvariants(result);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("Case D: 특정지역 우선 — district 가중치를 압도적으로 주면 그 지역이 1위여야 한다", () => {
    const prefs: UserPreferences = {
      budget: 30000,
      preferredDistricts: ["강남구"],
      weights: { district: 80, price: 20 },
    };
    const result = recommend(prefs);
    checkInvariants(result);
    expect(result.recommendations[0]?.district).toBe("강남구");
    expect(result.recommendations[0]?.scores.district).toBe(100);
  });

  it("Case E: 조건이 지나치게 엄격하면 결과가 적거나 0개여도 에러 없이 처리된다", () => {
    const prefs: UserPreferences = {
      budget: 25000,
      minArea: 30,
      maxBuildingAge: 5,
      preferredBuildingTypes: ["오피스텔"],
      preferredDistricts: ["용산구"],
      weights: { price: 30, space: 30, newness: 40 },
    };
    expect(() => recommend(prefs)).not.toThrow();
    const result = recommend(prefs);
    checkInvariants(result);
    expect(result.recommendations.length).toBeLessThanOrEqual(5);
  });

  it("Case F: 가중치 합이 100이 아니어도 정상 동작하고, 비율이 같으면 지역별 점수도 같다", () => {
    const over = recommend({ budget: 30000, weights: { price: 900, space: 100 } });
    const under = recommend({ budget: 30000, weights: { price: 9, space: 1 } });
    checkInvariants(over);
    checkInvariants(under);
    // 가중치 비율이 같으므로(9:1) 지역별 totalScore가 동일해야 한다.
    // (근소한 차이로 순위가 뒤바뀔 수 있는 두 지역의 정렬 순서까지 동일할 필요는 없음 —
    //  정규화 로직의 정확성은 raw score 비교로 검증한다.)
    const overByDistrict = new Map(over.alternatives.concat(over.recommendations).map((r) => [r.district, r.totalScore]));
    const underByDistrict = new Map(under.alternatives.concat(under.recommendations).map((r) => [r.district, r.totalScore]));
    for (const [district, score] of overByDistrict) {
      expect(underByDistrict.get(district)).toBeCloseTo(score, 5);
    }
  });

  it("Case G: budget 외 입력값이 전부 누락되어도 에러 없이 처리된다", () => {
    const result = recommend({ budget: 30000, weights: {} });
    checkInvariants(result);
    expect(result.recommendations.length).toBeGreaterThan(0);
    // 지역/유형 필터가 없으므로 모든 지역에서 district/buildingType 점수는 중립(100)
    for (const r of result.recommendations) {
      expect(r.scores.district).toBe(100);
      expect(r.scores.buildingType).toBe(100);
    }
  });

  it("budget이 0 이하면 예외를 던진다", () => {
    expect(() => recommend({ budget: 0, weights: {} })).toThrow();
    expect(() => recommend({ budget: -100, weights: {} })).toThrow();
  });

  it("추천 결과에는 실제 계산된 reasons/strengths가 최소 1개 이상 포함된다", () => {
    const result = recommend({
      budget: 30000,
      weights: { price: 50, space: 50 },
    });
    const top = result.recommendations[0];
    expect(top).toBeDefined();
    expect(top.reasons.length).toBeGreaterThan(0);
    // reasons 문장에는 임의 문구가 아니라 실제 숫자가 포함되어야 한다는 최소한의 sanity check
    expect(top.reasons.some((r) => /\d/.test(r))).toBe(true);
  });
});
