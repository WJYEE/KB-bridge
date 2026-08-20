import type { TransactionRow } from "./schema";
import type {
  AgeBucket,
  AreaBucket,
  BuildingType,
  FloorBucket,
  PriceBucket,
  Transaction,
} from "./types";

export const PYEONG_PER_SQM = 1 / 3.3058;

/** ㎡ -> 평 */
export function toPyeong(areaSqm: number): number {
  return areaSqm / 3.3058;
}

/**
 * 면적구간 경계값(㎡).
 * 임의 기준이 아니라 국토교통부/한국부동산원이 실무에서 쓰는
 * "국민주택규모"(85㎡) 및 통상적인 평형 구분(20/40/60/85/135㎡)을 사용하고,
 * 실제 데이터 분포(p5≈21㎡, p25≈41㎡, p50≈60㎡, p90≈104㎡, p95≈126㎡)와도
 * 대체로 맞아떨어지는 것을 확인한 뒤 채택했다.
 * (2024~2026 서울 실거래 최종 데이터셋 기준 분석, scripts/preprocess-realestate.ts 참고)
 */
const AREA_BUCKET_EDGES: [number, AreaBucket][] = [
  [20, "20㎡ 미만"],
  [40, "20~40㎡"],
  [60, "40~60㎡"],
  [85, "60~85㎡"],
  [135, "85~135㎡"],
  [Infinity, "135㎡ 이상"],
];

export function getAreaBucket(areaSqm: number): AreaBucket {
  for (const [edge, label] of AREA_BUCKET_EDGES) {
    if (areaSqm < edge) return label;
  }
  return "135㎡ 이상";
}

/**
 * 가격구간 경계값(만원).
 * 서비스의 핵심 시나리오(분석 B: "2억/3억/4억으로 어디까지 가능한가")가
 * 1억 단위 예산 구간을 기준으로 하므로, 사용자가 흔히 떠올리는 예산 단위(억원)에
 * 맞춰 2/3/4억을 그대로 경계로 쓰고 그 위는 실제 가격 분포
 * (p50≈6.75억, p75≈11.85억, p90≈18.5억, p95≈25억)를 참고해 6/10억을 추가 경계로 잡았다.
 */
const PRICE_BUCKET_EDGES: [number, PriceBucket][] = [
  [20000, "2억 미만"],
  [30000, "2~3억"],
  [40000, "3~4억"],
  [60000, "4~6억"],
  [100000, "6~10억"],
  [Infinity, "10억 이상"],
];

export function getPriceBucket(priceManwon: number): PriceBucket {
  for (const [edge, label] of PRICE_BUCKET_EDGES) {
    if (priceManwon < edge) return label;
  }
  return "10억 이상";
}

/**
 * 연식구간 경계값(년).
 * 프롬프트/기획에서 이미 "건축 5년 이하 = 신축" 기준을 명시했으므로 그대로 채택했고,
 * 준신축/구축/노후 경계(15/30년)는 실제 연식 분포(p50≈21년, p75≈29년, p90≈37년)에서
 * 시장에서 통상 "구축"으로 분류되는 30년(재건축 연한 근접)을 기준으로 나눴다.
 */
const AGE_BUCKET_EDGES: [number, AgeBucket][] = [
  [5, "신축(5년 이하)"],
  [15, "준신축(6~15년)"],
  [30, "구축(16~30년)"],
  [Infinity, "노후(31년 이상)"],
];

export function getAgeBucket(ageYears: number): AgeBucket {
  for (const [edge, label] of AGE_BUCKET_EDGES) {
    if (ageYears <= edge) return label;
  }
  return "노후(31년 이상)";
}

/**
 * 층 구간 경계값(저층 ≤3층, 중층 4~9층, 고층 10층 이상).
 * 원본 데이터에 건물 전체 층수가 없어 "몇 층 건물 중 몇 층"인지 알 수 없으므로
 * 절대 층수만으로 임의 구간을 나눴다 — 국토부·건축 실무에서 통상 쓰는 저/중/고층
 * 3단 구분을 채택했다. 반지하/지하(음수) 및 1층은 "저층"으로 묶는다.
 * 근거: DECISION_LOG.md "왜 절대 층수로 저/중/고층을 나눴는가" 참고.
 */
export function getFloorBucket(floor: number): FloorBucket {
  if (floor <= 3) return "저층";
  if (floor <= 9) return "중층";
  return "고층";
}

export function isValidBuildingType(value: string): value is BuildingType {
  return (
    value === "아파트" ||
    value === "연립다세대" ||
    value === "오피스텔" ||
    value === "단독다가구"
  );
}

/** 정렬된 숫자 배열의 중앙값 */
export function median(sortedValues: number[]): number {
  const n = sortedValues.length;
  if (n === 0) return NaN;
  const mid = Math.floor(n / 2);
  return n % 2 === 0
    ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
    : sortedValues[mid];
}

/** 정렬된 숫자 배열의 백분위수 (p: 0~1) */
export function percentile(sortedValues: number[], p: number): number {
  const n = sortedValues.length;
  if (n === 0) return NaN;
  const idx = Math.min(n - 1, Math.max(0, Math.floor(n * p)));
  return sortedValues[idx];
}

export function mean(values: number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** 표본표준편차 */
export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** 변동계수(CV) = 표준편차 / |평균|. 평균이 0에 가까우면 정의되지 않으므로 0 처리 */
export function coefficientOfVariation(values: number[]): number {
  const m = mean(values);
  if (!Number.isFinite(m) || Math.abs(m) < 1e-9) return 0;
  return stddev(values) / Math.abs(m);
}

/**
 * compact row(TransactionRow) -> 파생변수 포함 Transaction 객체.
 * 전처리 스크립트(빌드타임)와 서버 데이터 로더(런타임)가 동일한 파생 로직을
 * 공유하도록 이 파일 한 곳에서만 정의한다.
 */
export function deriveTransaction(row: TransactionRow): Transaction {
  const [year, district, dong, buildingName, contractDate, price, area, floor, buildYear, type] =
    row;
  const pyeong = toPyeong(area);
  const contractYear = Math.floor(contractDate / 10000);
  const hasValidBuildYear = buildYear > 1900 && buildYear <= contractYear + 1;
  const age = hasValidBuildYear ? contractYear - buildYear : null;

  return {
    year,
    district,
    dong,
    buildingName,
    contractDate,
    price,
    area,
    floor,
    buildYear,
    type: type as BuildingType,
    pyeong,
    pricePerArea: price / area,
    pricePerPyeong: price / pyeong,
    age,
    areaBucket: getAreaBucket(area),
    priceBucket: getPriceBucket(price),
    ageBucket: age === null ? null : getAgeBucket(age),
  };
}
