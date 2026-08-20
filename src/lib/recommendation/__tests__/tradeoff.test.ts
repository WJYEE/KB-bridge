import { describe, expect, it } from "vitest";
import {
  changeBudget,
  changeMinArea,
  expandBuildingTypes,
  relaxDistrictCondition,
  relaxNewnessCondition,
  simulateTradeoff,
} from "../tradeoff";
import type { UserPreferences } from "../types";

describe("Trade-off Simulator", () => {
  it("신축 조건을 완화하면 매칭 거래 수/지역 수가 감소하지 않는다 (부분집합 관계)", () => {
    const base: UserPreferences = {
      budget: 40000,
      maxBuildingAge: 10,
      weights: {},
    };
    const result = relaxNewnessCondition(base);
    expect(result.changed.matchingCount).toBeGreaterThanOrEqual(result.base.matchingCount);
    expect(result.changed.districtsWithMatches).toBeGreaterThanOrEqual(result.base.districtsWithMatches);
  });

  it("희망 지역 고정을 풀면(1개 -> 전체) 매칭 거래 수가 늘어나거나 같다", () => {
    const base: UserPreferences = {
      budget: 30000,
      preferredDistricts: ["강서구"],
      weights: {},
    };
    const result = relaxDistrictCondition(base);
    expect(result.changed.matchingCount).toBeGreaterThanOrEqual(result.base.matchingCount);
    expect(result.changed.districtsWithMatches).toBeGreaterThanOrEqual(result.base.districtsWithMatches);
  });

  it("주택유형을 확장하면 매칭 거래 수가 늘어나거나 같다", () => {
    const base: UserPreferences = {
      budget: 30000,
      preferredBuildingTypes: ["아파트"],
      weights: {},
    };
    const result = expandBuildingTypes(base, ["아파트", "오피스텔", "연립다세대"]);
    expect(result.changed.matchingCount).toBeGreaterThanOrEqual(result.base.matchingCount);
  });

  it("최소 면적 조건을 낮추면(30㎡ -> 20㎡) 매칭 거래 수가 늘어나거나 같다", () => {
    const base: UserPreferences = { budget: 30000, minArea: 30, weights: {} };
    const result = changeMinArea(base, 20);
    expect(result.changed.matchingCount).toBeGreaterThanOrEqual(result.base.matchingCount);
  });

  it("예산을 늘리면(2.5억 -> 3억) 매칭 거래 수가 늘어나거나 같다", () => {
    const base: UserPreferences = { budget: 25000, weights: {} };
    const result = changeBudget(base, 30000);
    expect(result.changed.matchingCount).toBeGreaterThanOrEqual(result.base.matchingCount);
    expect(result.delta.matchingCount).toBeGreaterThanOrEqual(0);
  });

  it("조건 변화가 실제로 있으면 summary에 최소 1개 이상의 실측 문장이 생긴다", () => {
    const base: UserPreferences = { budget: 25000, maxBuildingAge: 10, weights: {} };
    const result = simulateTradeoff(base, { budget: 25000, weights: {} });
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.summary.some((s) => /\d/.test(s))).toBe(true);
  });

  it("동일한 조건이면 delta가 전부 0이고 summary가 비어있다", () => {
    const prefs: UserPreferences = { budget: 30000, weights: {} };
    const result = simulateTradeoff(prefs, { ...prefs });
    expect(result.delta.matchingCount).toBe(0);
    expect(result.delta.districtsWithMatches).toBe(0);
    expect(result.summary).toEqual([]);
  });
});
