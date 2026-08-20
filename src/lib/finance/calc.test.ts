import { describe, expect, it } from "vitest";
import { calculateFinance, classifyReadiness } from "./calc";

describe("calculateFinance", () => {
  it("표준 원리금균등상환 공식과 일치한다 (2억원, 4.5%, 30년 ≈ 월 101만원)", () => {
    const result = calculateFinance({
      housePrice: 20000,
      equity: 0,
      annualRatePercent: 4.5,
      years: 30,
    });
    expect(result.loanAmount).toBe(20000);
    expect(result.monthlyPayment).toBeGreaterThan(100);
    expect(result.monthlyPayment).toBeLessThan(103);
  });

  it("자기자본이 주택가격 이상이면 대출 0, 상환액 0", () => {
    const result = calculateFinance({
      housePrice: 20000,
      equity: 25000,
      annualRatePercent: 4.5,
      years: 30,
    });
    expect(result.loanAmount).toBe(0);
    expect(result.monthlyPayment).toBe(0);
    expect(result.totalInterest).toBe(0);
  });

  it("금리 0%면 단순 균등분할이다", () => {
    const result = calculateFinance({
      housePrice: 12000,
      equity: 0,
      annualRatePercent: 0,
      years: 10,
    });
    expect(result.monthlyPayment).toBeCloseTo(12000 / 120, 5);
    expect(result.totalInterest).toBe(0);
  });

  it("월소득 미입력 시 dtiRatio는 null", () => {
    const result = calculateFinance({ housePrice: 20000, equity: 5000, annualRatePercent: 4, years: 30 });
    expect(result.dtiRatio).toBeNull();
  });

  it("월소득 입력 시 dtiRatio를 계산한다", () => {
    const result = calculateFinance({
      housePrice: 20000,
      equity: 5000,
      annualRatePercent: 4,
      years: 30,
      monthlyIncome: 400,
    });
    expect(result.dtiRatio).not.toBeNull();
    expect(result.dtiRatio).toBeGreaterThan(0);
  });

  it("총 상환액 = 총 이자 + 대출원금", () => {
    const result = calculateFinance({ housePrice: 30000, equity: 8000, annualRatePercent: 4.5, years: 20 });
    expect(result.totalPayment).toBe(result.totalInterest + result.loanAmount);
  });
});

describe("classifyReadiness", () => {
  it("자기자본비율 30%↑, DTI 40%↓ 이면 BUY", () => {
    const r = calculateFinance({ housePrice: 30000, equity: 10000, annualRatePercent: 4, years: 30, monthlyIncome: 500 });
    expect(classifyReadiness(r).tier).toBe("BUY");
  });

  it("자기자본비율 5%면 RENT_GROW", () => {
    const r = calculateFinance({ housePrice: 30000, equity: 1500, annualRatePercent: 4, years: 30 });
    expect(classifyReadiness(r).tier).toBe("RENT_GROW");
  });
});
