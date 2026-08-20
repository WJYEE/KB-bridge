import type { UserPreferences } from "../recommendation/types";

/**
 * Assessment 입력값은 예산·자기자본 등 민감할 수 있는 금융정보를 포함하므로
 * URL query에 노출하지 않고 sessionStorage에만 보관한다 (기획 §31).
 * 서버에는 추천/Trade-off 계산을 위해 요청 시점에만 전달하고 별도로 저장하지 않는다.
 */
const STORAGE_KEY = "cheotjipon.assessment.v1";

export interface StoredAssessment {
  prefs: UserPreferences;
  presetId?: string;
}

export function saveAssessment(data: StoredAssessment): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadAssessment(): StoredAssessment | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAssessment;
  } catch {
    return null;
  }
}

export function clearAssessment(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

const FINANCE_KEY = "cheotjipon.finance-context.v1";

/** Result 페이지에서 "이 지역으로 금융 시뮬레이션" 클릭 시 넘길 컨텍스트 */
export interface FinanceContext {
  district: string;
  housePrice: number; // 만원
  equity?: number;
}

export function saveFinanceContext(ctx: FinanceContext): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(FINANCE_KEY, JSON.stringify(ctx));
}

export function loadFinanceContext(): FinanceContext | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(FINANCE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FinanceContext;
  } catch {
    return null;
  }
}
