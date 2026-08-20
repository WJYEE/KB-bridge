/**
 * 금융 시뮬레이션 — 순수 수식 계산 (실거래 데이터와 무관, 정보성 시뮬레이션).
 * MVP는 원리금균등상환(equal principal + interest, annuity) 방식만 구현한다
 * (기획 §24 "최소 원리금균등 계산부터 구현").
 */
export interface FinanceInput {
  housePrice: number; // 주택가격 (만원)
  equity: number; // 자기자본 (만원)
  annualRatePercent: number; // 연 금리 (%, 예: 4.5)
  years: number; // 대출기간 (년)
  monthlyIncome?: number; // 월 소득 (만원). 없으면 부담 비율 계산 생략
}

export interface FinanceResult {
  loanAmount: number; // 필요 대출 (만원)
  monthlyPayment: number; // 예상 월 상환액 (만원)
  annualPayment: number; // 연간 상환액 (만원)
  totalPayment: number; // 총 상환액 (만원)
  totalInterest: number; // 총 예상 이자 (만원)
  equityRatio: number; // 자기자본 비율 (0~1)
  dtiRatio: number | null; // 월 상환액 / 월 소득 (0~1), 월소득 미입력 시 null
}

/**
 * 원리금균등상환 월 상환액 공식:
 *   M = P * r(1+r)^n / ((1+r)^n - 1)
 *   P: 대출원금, r: 월 이자율, n: 총 개월 수
 * 금리가 0%인 경우(무이자) 위 공식이 0/0이 되므로 단순 균등분할로 처리한다.
 */
export function calculateFinance(input: FinanceInput): FinanceResult {
  const loanAmount = Math.max(0, input.housePrice - input.equity);
  const n = Math.max(1, Math.round(input.years * 12));
  const r = input.annualRatePercent / 100 / 12;

  let monthlyPayment: number;
  if (loanAmount <= 0) {
    monthlyPayment = 0;
  } else if (r === 0) {
    monthlyPayment = loanAmount / n;
  } else {
    const factor = Math.pow(1 + r, n);
    monthlyPayment = (loanAmount * r * factor) / (factor - 1);
  }

  const totalPayment = monthlyPayment * n;
  const totalInterest = Math.max(0, totalPayment - loanAmount);
  const equityRatio = input.housePrice > 0 ? Math.min(1, input.equity / input.housePrice) : 0;
  const dtiRatio =
    input.monthlyIncome && input.monthlyIncome > 0 ? monthlyPayment / input.monthlyIncome : null;

  return {
    loanAmount: Math.round(loanAmount),
    monthlyPayment: Math.round(monthlyPayment * 10) / 10,
    annualPayment: Math.round(monthlyPayment * 12),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    equityRatio: Math.round(equityRatio * 1000) / 1000,
    dtiRatio: dtiRatio !== null ? Math.round(dtiRatio * 1000) / 1000 : null,
  };
}

export type ReadinessTier = "BUY" | "WAIT" | "RENT_GROW";

export interface ReadinessConcept {
  tier: ReadinessTier;
  label: string;
  message: string;
}

/**
 * BUY / WAIT / RENT & GROW — 정보성 Concept Preview (기획 §27).
 * 완전한 추천 알고리즘이 아니라 자기자본 비율과 DTI 비율만 보는 단순 휴리스틱이며,
 * 실제 대출 심사 결과를 예측하지 않는다는 점을 UI에 항상 병기한다.
 * 임계값(30%/15%, DTI 40%)은 국내 시중은행이 통상 안내하는 "여유 있는 자기자본 비율"
 * 감각을 참고한 자체 기준으로, 데이터로 검증된 최적값이 아니다 (DECISION_LOG 참고).
 */
export function classifyReadiness(result: FinanceResult): ReadinessConcept {
  if (result.equityRatio >= 0.3 && (result.dtiRatio === null || result.dtiRatio <= 0.4)) {
    return {
      tier: "BUY",
      label: "BUY",
      message: "현재 입력 조건에서는 자기자본 비율이 상대적으로 여유 있는 시나리오입니다.",
    };
  }
  if (result.equityRatio >= 0.15) {
    return {
      tier: "WAIT",
      label: "WAIT",
      message: "지금 구매하면 대출 의존도가 높습니다. 자기자본을 더 확보한 뒤 재분석하는 것을 고려해볼 수 있습니다.",
    };
  }
  return {
    tier: "RENT_GROW",
    label: "RENT & GROW",
    message: "현재 자기자본으로는 대출 부담이 매우 큽니다. 임대·자산 형성을 병행하는 시나리오를 참고해보세요.",
  };
}
