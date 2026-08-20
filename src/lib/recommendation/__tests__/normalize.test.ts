import { describe, expect, it } from "vitest";
import { clippedMinMaxScore, normalizeWeights, rankPercentileScore } from "../normalize";

describe("normalizeWeights", () => {
  it("합계가 100이 아니어도 비율 그대로 정규화한다 (Case F)", () => {
    const w = normalizeWeights({ price: 10, space: 10 }); // 합 20, 100 아님
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
    expect(w.price).toBeCloseTo(0.5, 5);
    expect(w.space).toBeCloseTo(0.5, 5);
  });

  it("합계가 100을 훨씬 초과해도 비율만 유지한다", () => {
    const w = normalizeWeights({ price: 900, space: 100 });
    expect(w.price).toBeCloseTo(0.9, 5);
    expect(w.space).toBeCloseTo(0.1, 5);
  });

  it("입력이 비어있으면 8개 항목 균등 가중치로 대체한다 (Case G)", () => {
    const w = normalizeWeights({});
    const values = Object.values(w);
    expect(values).toHaveLength(8);
    for (const v of values) expect(v).toBeCloseTo(1 / 8, 5);
  });

  it("음수는 0으로 취급한다", () => {
    const w = normalizeWeights({ price: -50, space: 50 });
    expect(w.price).toBe(0);
    expect(w.space).toBeCloseTo(1, 5);
  });
});

describe("clippedMinMaxScore", () => {
  it("모집단 최솟값 근처는 0에 가깝고 최댓값 근처는 100에 가깝다", () => {
    const pop = Array.from({ length: 100 }, (_, i) => i); // 0..99
    expect(clippedMinMaxScore(0, pop)).toBeLessThan(10);
    expect(clippedMinMaxScore(99, pop)).toBeGreaterThan(90);
  });

  it("극단적 outlier가 나머지 값의 변별력을 죽이지 않는다", () => {
    const pop = [...Array.from({ length: 24 }, (_, i) => 10 + i), 100000]; // outlier 1개
    const midScore = clippedMinMaxScore(20, pop);
    // 극단값이 없었다면 20은 중간값 근처여야 하고, clip 덕분에 0~100 사이 어딘가에서
    // 여전히 변별력 있는 값이 나와야 한다 (0에 완전히 뭉개지지 않음).
    expect(midScore).toBeGreaterThan(10);
    expect(midScore).toBeLessThan(90);
  });

  it("invert 옵션은 점수를 반전시킨다", () => {
    const pop = [0, 25, 50, 75, 100];
    const normal = clippedMinMaxScore(75, pop);
    const inverted = clippedMinMaxScore(75, pop, { invert: true });
    expect(Math.round(normal + inverted)).toBe(100);
  });

  it("모집단이 1개뿐이면 중립값 50을 반환한다", () => {
    expect(clippedMinMaxScore(10, [10])).toBe(50);
  });
});

describe("rankPercentileScore", () => {
  it("최댓값은 100에 가깝고 최솟값은 0에 가깝다", () => {
    const pop = [1, 2, 3, 4, 5];
    expect(rankPercentileScore(1, pop)).toBe(0);
    expect(rankPercentileScore(5, pop)).toBe(100);
  });
});
