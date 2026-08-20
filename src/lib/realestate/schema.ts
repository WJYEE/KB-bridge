/**
 * data/processed/transactions.json 의 행(row) 포맷.
 * 284,000여 건을 객체 배열(JSON object array)로 저장하면 키 이름이 매 행마다
 * 반복되어 파일 용량이 커지므로, 값만 담은 배열(tuple)로 저장하고
 * 이 인덱스 순서를 유일한 스키마로 삼는다. (server-only 데이터, 클라이언트 번들 미포함)
 *
 * 파생변수(평수/㎡당가격/연식/구간 등)는 저장하지 않고 로딩 시점에
 * src/lib/realestate/derive.ts 로 계산한다 (파일 용량 절감 + 버킷 기준 변경 시
 * 재전처리 없이 코드만 수정하면 반영됨).
 */
export const TRANSACTION_ROW_COLUMNS = [
  "year", // 접수연도
  "district", // 자치구명
  "dong", // 법정동명
  "buildingName", // 건물명 (null 가능: 단독다가구)
  "contractDate", // 계약일 YYYYMMDD
  "price", // 물건금액(만원)
  "area", // 건물면적(㎡)
  "floor", // 층 (null 가능: 단독다가구)
  "buildYear", // 건축년도 (0: 결측/미상)
  "type", // 건물용도
] as const;

export type TransactionRow = [
  number, // year
  string, // district
  string, // dong
  string | null, // buildingName
  number, // contractDate
  number, // price
  number, // area
  number | null, // floor
  number, // buildYear
  string, // type
];

export interface TransactionsFile {
  generatedAt: string;
  sourceFile: string;
  sourceSheet: string;
  rowCount: number;
  columns: typeof TRANSACTION_ROW_COLUMNS;
  rows: TransactionRow[];
}
