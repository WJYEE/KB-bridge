/**
 * 서버 전용 데이터 접근 계층.
 *
 * data/processed/*.json (전처리 스크립트 산출물)을 읽어 메모리에 캐싱한다.
 * transactions.json(25.7MB)을 요청마다 다시 읽고 파싱하면 느리므로,
 * 모듈 스코프 변수에 1회만 로드해 Node 프로세스가 살아있는 동안 재사용한다
 * (Next.js 서버 컴포넌트/라우트 핸들러는 같은 프로세스에서 모듈을 공유한다).
 *
 * 이 모듈은 절대 클라이언트 컴포넌트에서 import하지 않는다 — "use client" 파일이나
 * 브라우저 번들에 포함되면 25MB+ 데이터가 그대로 딸려간다.
 */
import "server-only";
import * as fs from "node:fs";
import * as path from "node:path";
import { deriveTransaction } from "./derive";
import type { TransactionsFile } from "./schema";
import type {
  BuildingTypeSummary,
  DistrictYearTypeSummary,
  Transaction,
  YearSummary,
} from "./types";

const PROCESSED_DIR = path.resolve(process.cwd(), "data/processed");

function readJSON<T>(fileName: string): T {
  const filePath = path.join(PROCESSED_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `${fileName} 이 없습니다. 먼저 "npm run preprocess" 를 실행해 data/processed/ 를 생성하세요. (${filePath})`,
    );
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

let transactionsCache: Transaction[] | null = null;
let districtSummaryCache: DistrictYearTypeSummary[] | null = null;
let yearSummaryCache: YearSummary[] | null = null;
let buildingTypeSummaryCache: BuildingTypeSummary[] | null = null;

export function getTransactions(): Transaction[] {
  if (!transactionsCache) {
    const file = readJSON<TransactionsFile>("transactions.json");
    transactionsCache = file.rows.map(deriveTransaction);
  }
  return transactionsCache;
}

export function getDistrictSummary(): DistrictYearTypeSummary[] {
  if (!districtSummaryCache) {
    districtSummaryCache = readJSON<DistrictYearTypeSummary[]>("district-summary.json");
  }
  return districtSummaryCache;
}

export function getYearSummary(): YearSummary[] {
  if (!yearSummaryCache) {
    yearSummaryCache = readJSON<YearSummary[]>("year-summary.json");
  }
  return yearSummaryCache;
}

export function getBuildingTypeSummary(): BuildingTypeSummary[] {
  if (!buildingTypeSummaryCache) {
    buildingTypeSummaryCache = readJSON<BuildingTypeSummary[]>("building-type-summary.json");
  }
  return buildingTypeSummaryCache;
}

let districtListCache: string[] | null = null;

/** 실거래 데이터에 존재하는 25개 자치구명 (알파벳/가나다 순) */
export function listDistricts(): string[] {
  if (!districtListCache) {
    const set = new Set(getTransactions().map((t) => t.district));
    districtListCache = [...set].sort((a, b) => a.localeCompare(b, "ko"));
  }
  return districtListCache;
}

let yearsCache: number[] | null = null;

export function listYears(): number[] {
  if (!yearsCache) {
    const set = new Set(getTransactions().map((t) => t.year));
    yearsCache = [...set].sort((a, b) => a - b);
  }
  return yearsCache;
}

/** 테스트/스크립트에서 캐시를 초기화해야 할 때 사용 (예: 다른 데이터 픽스처로 교체) */
export function __resetCacheForTests(): void {
  transactionsCache = null;
  districtSummaryCache = null;
  yearSummaryCache = null;
  buildingTypeSummaryCache = null;
  districtListCache = null;
  yearsCache = null;
}
