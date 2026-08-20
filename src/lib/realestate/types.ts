// 서울시 부동산 실거래가 도메인 타입 정의
// 원본 컬럼명(한글)은 데이터 출처 표기를 위해 유지하고,
// 서비스 로직에서는 아래 영문 필드명으로 정규화한다.

export type BuildingType = "아파트" | "연립다세대" | "오피스텔" | "단독다가구";

export const BUILDING_TYPES: BuildingType[] = [
  "아파트",
  "연립다세대",
  "오피스텔",
  "단독다가구",
];

/** 실거래 데이터에 존재하는 서울 25개 자치구 (DATA_ANALYSIS.md §4에서 전수 검증) */
export const SEOUL_DISTRICTS = [
  "강남구",
  "강동구",
  "강북구",
  "강서구",
  "관악구",
  "광진구",
  "구로구",
  "금천구",
  "노원구",
  "도봉구",
  "동대문구",
  "동작구",
  "마포구",
  "서대문구",
  "서초구",
  "성동구",
  "성북구",
  "송파구",
  "양천구",
  "영등포구",
  "용산구",
  "은평구",
  "종로구",
  "중구",
  "중랑구",
] as const;

export type AreaBucket =
  | "20㎡ 미만"
  | "20~40㎡"
  | "40~60㎡"
  | "60~85㎡"
  | "85~135㎡"
  | "135㎡ 이상";

export type PriceBucket =
  | "2억 미만"
  | "2~3억"
  | "3~4억"
  | "4~6억"
  | "6~10억"
  | "10억 이상";

export type AgeBucket = "신축(5년 이하)" | "준신축(6~15년)" | "구축(16~30년)" | "노후(31년 이상)";

export type FloorBucket = "저층" | "중층" | "고층";

/** 전처리 완료 후 개별 거래 1건 (파생변수 포함) */
export interface Transaction {
  year: number; // 접수연도
  district: string; // 자치구명
  dong: string; // 법정동명
  buildingName: string | null; // 건물명 (단독다가구는 결측 가능)
  contractDate: number; // 계약일 YYYYMMDD
  price: number; // 물건금액(만원)
  area: number; // 건물면적(㎡)
  floor: number | null; // 층 (단독다가구는 결측 가능)
  buildYear: number; // 건축년도
  type: BuildingType; // 건물용도

  // --- 파생변수 ---
  pyeong: number; // 평수 = area / 3.3058
  pricePerArea: number; // ㎡당 가격(만원) = price / area
  pricePerPyeong: number; // 평당 가격(만원) = price / pyeong
  // 건축년도가 0/결측인 행은 행 자체를 제거하지 않고 연식 파생변수만 null 처리한다.
  age: number | null; // 건물연식 = 계약연도 - 건축년도
  areaBucket: AreaBucket;
  priceBucket: PriceBucket;
  ageBucket: AgeBucket | null;
}

export interface DistrictYearTypeSummary {
  district: string;
  year: number;
  type: BuildingType | "전체";
  count: number;
  medianPrice: number; // 만원
  medianPricePerArea: number; // 만원/㎡
  medianPricePerPyeong: number; // 만원/평
  medianArea: number; // ㎡
}

export interface YearSummary {
  year: number;
  type: BuildingType | "전체";
  count: number;
  medianPrice: number;
  medianPricePerArea: number;
}

export interface BuildingTypeSummary {
  type: BuildingType;
  ageBucket: AgeBucket | "전체";
  count: number;
  medianPrice: number;
  medianArea: number;
  medianPricePerArea: number;
  medianAge: number;
}
