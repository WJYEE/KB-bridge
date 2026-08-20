/**
 * 서울시 부동산 실거래가 전처리 스크립트
 *
 * 입력: data/raw/최종1차데이터셋.xlsx (Sheet2)
 *   - 이미 취소거래 제외, 자치구명 결측 제외, 건축년도=0 결측 제외까지 완료된
 *     "최종 1차" 정제본이다 (팀에서 사전 작업). 이 스크립트는 원본을 신뢰하되,
 *     서비스에 넘기기 전 다시 한 번 핵심 컬럼 결측/가격·면적 유효성을 방어적으로
 *     검증하고, 파생변수 계산에 필요한 형태로 변환 + 집계한다.
 *   - 원본 xlsx/csv는 절대 수정하지 않는다 (읽기 전용).
 *
 * 출력 (data/processed/, 모두 .gitignore 대상 — 이 스크립트로 재생성 가능):
 *   - transactions.json         : 정제된 개별 거래 (server-only, compact row 포맷)
 *   - district-summary.json     : 자치구 x 연도 x 유형별 집계 (분석 A, E)
 *   - year-summary.json         : 연도 x 유형별 시계열 집계 (분석 A)
 *   - building-type-summary.json: 유형 x 연식구간별 집계 (분석 C, D)
 *
 * 실행: npm run preprocess
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";
import { deriveTransaction, isValidBuildingType, median } from "../src/lib/realestate/derive";
import type { TransactionRow, TransactionsFile } from "../src/lib/realestate/schema";
import { TRANSACTION_ROW_COLUMNS } from "../src/lib/realestate/schema";
import type {
  BuildingType,
  DistrictYearTypeSummary,
  YearSummary,
  BuildingTypeSummary,
  Transaction,
} from "../src/lib/realestate/types";
import { BUILDING_TYPES } from "../src/lib/realestate/types";

const ROOT = path.resolve(__dirname, "..");
const SOURCE_FILE = path.join(ROOT, "data/raw/최종1차데이터셋.xlsx");
const SOURCE_SHEET = "Sheet2";
const OUT_DIR = path.join(ROOT, "data/processed");

interface RawRecord {
  [key: string]: unknown;
}

interface ExclusionStats {
  totalRawRows: number;
  missingDistrict: number;
  missingDong: number;
  missingPrice: number;
  missingArea: number;
  missingBuildingType: number;
  missingContractDate: number;
  invalidBuildingType: number;
  priceNotPositive: number;
  areaNotPositive: number;
  buildYearMissingOrZero: number; // 제외하지 않고 age만 null 처리하지만, 규모 파악을 위해 카운트
  keptRows: number;
}

function readSourceRows(): RawRecord[] {
  if (!fs.existsSync(SOURCE_FILE)) {
    throw new Error(
      `원본 데이터 파일을 찾을 수 없습니다: ${SOURCE_FILE}\n` +
        `data/raw/ 폴더에 "최종1차데이터셋.xlsx"가 있는지 확인하세요.`,
    );
  }
  const wb = XLSX.readFile(SOURCE_FILE);
  if (!wb.SheetNames.includes(SOURCE_SHEET)) {
    throw new Error(
      `시트 "${SOURCE_SHEET}"를 찾을 수 없습니다. 사용 가능한 시트: ${wb.SheetNames.join(", ")}`,
    );
  }
  const ws = wb.Sheets[SOURCE_SHEET];
  return XLSX.utils.sheet_to_json<RawRecord>(ws, { defval: null });
}

function toTrimmedStringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function cleanRows(raw: RawRecord[]): { rows: TransactionRow[]; stats: ExclusionStats } {
  const stats: ExclusionStats = {
    totalRawRows: raw.length,
    missingDistrict: 0,
    missingDong: 0,
    missingPrice: 0,
    missingArea: 0,
    missingBuildingType: 0,
    missingContractDate: 0,
    invalidBuildingType: 0,
    priceNotPositive: 0,
    areaNotPositive: 0,
    buildYearMissingOrZero: 0,
    keptRows: 0,
  };

  const rows: TransactionRow[] = [];

  for (const r of raw) {
    const year = toNumberOrNull(r["접수연도"]);
    const district = toTrimmedStringOrNull(r["자치구명"]);
    const dong = toTrimmedStringOrNull(r["법정동명"]);
    const buildingName = toTrimmedStringOrNull(r["건물명"]);
    const contractDate = toNumberOrNull(r["계약일"]);
    const price = toNumberOrNull(r["물건금액(만원)"]);
    const area = toNumberOrNull(r["건물면적(㎡)"]);
    const floor = toNumberOrNull(r["층"]);
    const buildYearRaw = toNumberOrNull(r["건축년도"]);
    const type = toTrimmedStringOrNull(r["건물용도"]);

    // --- 핵심 결측치: 없으면 행 제외 ---
    if (district === null) {
      stats.missingDistrict++;
      continue;
    }
    if (dong === null) {
      stats.missingDong++;
      continue;
    }
    if (price === null) {
      stats.missingPrice++;
      continue;
    }
    if (area === null) {
      stats.missingArea++;
      continue;
    }
    if (type === null) {
      stats.missingBuildingType++;
      continue;
    }
    if (contractDate === null || year === null) {
      stats.missingContractDate++;
      continue;
    }
    if (!isValidBuildingType(type)) {
      stats.invalidBuildingType++;
      continue;
    }
    // --- 가격/면적 유효성: 0 이하 제외 (고가·초소형이라는 이유만으로는 제거하지 않음) ---
    if (price <= 0) {
      stats.priceNotPositive++;
      continue;
    }
    if (area <= 0) {
      stats.areaNotPositive++;
      continue;
    }

    // 건축년도 0/결측: 행은 유지하고, 연식 파생변수 계산에서만 제외한다.
    const buildYear = buildYearRaw ?? 0;
    if (!buildYearRaw || buildYearRaw <= 0) {
      stats.buildYearMissingOrZero++;
    }

    rows.push([
      year,
      district,
      dong,
      buildingName,
      contractDate,
      price,
      area,
      floor,
      buildYear,
      type,
    ]);
    stats.keptRows++;
  }

  return { rows, stats };
}

function summarizeGroup(
  txs: Transaction[],
): Pick<
  DistrictYearTypeSummary,
  "count" | "medianPrice" | "medianPricePerArea" | "medianPricePerPyeong" | "medianArea"
> {
  const prices = txs.map((t) => t.price).sort((a, b) => a - b);
  const pricePerAreas = txs.map((t) => t.pricePerArea).sort((a, b) => a - b);
  const pricePerPyeongs = txs.map((t) => t.pricePerPyeong).sort((a, b) => a - b);
  const areas = txs.map((t) => t.area).sort((a, b) => a - b);
  return {
    count: txs.length,
    medianPrice: Math.round(median(prices)),
    medianPricePerArea: Math.round(median(pricePerAreas) * 10) / 10,
    medianPricePerPyeong: Math.round(median(pricePerPyeongs)),
    medianArea: Math.round(median(areas) * 100) / 100,
  };
}

function buildDistrictSummary(transactions: Transaction[]): DistrictYearTypeSummary[] {
  const groups = new Map<string, Transaction[]>();
  const districts = new Set<string>();
  const years = new Set<number>();

  for (const t of transactions) {
    districts.add(t.district);
    years.add(t.year);
    const keyAll = `${t.district}|${t.year}|전체`;
    const keyType = `${t.district}|${t.year}|${t.type}`;
    if (!groups.has(keyAll)) groups.set(keyAll, []);
    if (!groups.has(keyType)) groups.set(keyType, []);
    groups.get(keyAll)!.push(t);
    groups.get(keyType)!.push(t);
  }

  const result: DistrictYearTypeSummary[] = [];
  for (const [key, txs] of groups) {
    const [district, yearStr, type] = key.split("|");
    result.push({
      district,
      year: Number(yearStr),
      type: type as DistrictYearTypeSummary["type"],
      ...summarizeGroup(txs),
    });
  }
  result.sort((a, b) => a.district.localeCompare(b.district) || a.year - b.year);
  return result;
}

function buildYearSummary(transactions: Transaction[]): YearSummary[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const keyAll = `${t.year}|전체`;
    const keyType = `${t.year}|${t.type}`;
    if (!groups.has(keyAll)) groups.set(keyAll, []);
    if (!groups.has(keyType)) groups.set(keyType, []);
    groups.get(keyAll)!.push(t);
    groups.get(keyType)!.push(t);
  }
  const result: YearSummary[] = [];
  for (const [key, txs] of groups) {
    const [yearStr, type] = key.split("|");
    const s = summarizeGroup(txs);
    result.push({
      year: Number(yearStr),
      type: type as YearSummary["type"],
      count: s.count,
      medianPrice: s.medianPrice,
      medianPricePerArea: s.medianPricePerArea,
    });
  }
  result.sort((a, b) => a.year - b.year);
  return result;
}

function buildBuildingTypeSummary(transactions: Transaction[]): BuildingTypeSummary[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const keyAll = `${t.type}|전체`;
    if (!groups.has(keyAll)) groups.set(keyAll, []);
    groups.get(keyAll)!.push(t);
    if (t.ageBucket) {
      const keyBucket = `${t.type}|${t.ageBucket}`;
      if (!groups.has(keyBucket)) groups.set(keyBucket, []);
      groups.get(keyBucket)!.push(t);
    }
  }
  const result: BuildingTypeSummary[] = [];
  for (const [key, txs] of groups) {
    const [type, ageBucket] = key.split("|");
    const s = summarizeGroup(txs);
    const ages = txs.map((t) => t.age).filter((a): a is number => a !== null).sort((a, b) => a - b);
    result.push({
      type: type as BuildingType,
      ageBucket: ageBucket as BuildingTypeSummary["ageBucket"],
      count: s.count,
      medianPrice: s.medianPrice,
      medianArea: s.medianArea,
      medianPricePerArea: s.medianPricePerArea,
      medianAge: ages.length ? median(ages) : NaN,
    });
  }
  // 유형별 표시 순서 고정 + 전체를 맨 앞에
  const order = ["전체", "신축(5년 이하)", "준신축(6~15년)", "구축(16~30년)", "노후(31년 이상)"];
  result.sort(
    (a, b) =>
      BUILDING_TYPES.indexOf(a.type) - BUILDING_TYPES.indexOf(b.type) ||
      order.indexOf(a.ageBucket) - order.indexOf(b.ageBucket),
  );
  return result;
}

function writeJSON(fileName: string, data: unknown) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const filePath = path.join(OUT_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data));
  const sizeMB = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);
  console.log(`  wrote ${fileName} (${sizeMB} MB)`);
}

function main() {
  console.log("=== 첫집ON 실거래가 전처리 시작 ===");
  console.log(`source: ${SOURCE_FILE} [${SOURCE_SHEET}]`);

  const raw = readSourceRows();
  console.log(`raw rows: ${raw.length}`);

  const { rows, stats } = cleanRows(raw);
  console.log("\n--- 전처리 결과 ---");
  console.log(stats);

  const transactions = rows.map(deriveTransaction);

  const transactionsFile: TransactionsFile = {
    generatedAt: new Date().toISOString(),
    sourceFile: path.relative(ROOT, SOURCE_FILE),
    sourceSheet: SOURCE_SHEET,
    rowCount: rows.length,
    columns: TRANSACTION_ROW_COLUMNS,
    rows,
  };

  console.log("\n--- 집계 생성 ---");
  writeJSON("transactions.json", transactionsFile);
  writeJSON("district-summary.json", buildDistrictSummary(transactions));
  writeJSON("year-summary.json", buildYearSummary(transactions));
  writeJSON("building-type-summary.json", buildBuildingTypeSummary(transactions));

  // 전처리 리포트 (DATA_ANALYSIS.md 작성용 원자료)
  writeJSON("_preprocess-report.json", {
    generatedAt: new Date().toISOString(),
    stats,
  });

  console.log("\n=== 완료 ===");
}

main();
