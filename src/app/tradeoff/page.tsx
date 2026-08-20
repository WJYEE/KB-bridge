"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { runTradeoff } from "@/app/actions";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Chip } from "@/components/assessment/Chip";
import { DeltaStat } from "@/components/tradeoff/DeltaStat";
import { loadAssessment } from "@/lib/assessment/storage";
import {
  formatArea,
  formatManwon,
  formatSignedArea,
  formatSignedCount,
  formatSignedManwon,
  formatSignedYear,
  formatYear,
} from "@/lib/format";
import { BUILDING_TYPES, SEOUL_DISTRICTS } from "@/lib/realestate/types";
import type { UserPreferences } from "@/lib/recommendation/types";
import type { TradeoffResult } from "@/lib/recommendation/tradeoff";

type DimensionKey = "maxBuildingAge" | "minArea" | "budget" | "district" | "buildingType";

const DIMENSIONS: { key: DimensionKey; label: string }[] = [
  { key: "maxBuildingAge", label: "건물연식" },
  { key: "minArea", label: "최소 면적" },
  { key: "budget", label: "예산" },
  { key: "district", label: "희망지역" },
  { key: "buildingType", label: "주택유형" },
];

const AGE_OPTIONS = [5, 10, 15, 20, undefined];
const AREA_OPTIONS = [20, 25, 30, 40, undefined];

export default function TradeoffPage() {
  const router = useRouter();
  const [base, setBase] = useState<UserPreferences | null>(null);
  const [dimension, setDimension] = useState<DimensionKey>("maxBuildingAge");
  const [changed, setChanged] = useState<UserPreferences | null>(null);
  const [result, setResult] = useState<TradeoffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedDistrict, setPickedDistrict] = useState<string>(SEOUL_DISTRICTS[0]);
  const [pickedType, setPickedType] = useState<(typeof BUILDING_TYPES)[number]>(BUILDING_TYPES[0]);

  // sessionStorage(클라이언트 전용)에서 읽어와 state에 반영하는 정상적인 "외부 시스템 동기화"
  // 패턴이라 set-state-in-effect 규칙을 비활성화한다 (finance/page.tsx와 동일한 사유).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = loadAssessment();
    if (!stored) {
      router.replace("/assessment");
      return;
    }
    setBase(stored.prefs);
  }, [router]);

  useEffect(() => {
    if (!base || !changed) return;
    setLoading(true);
    setError(null);
    runTradeoff(base, changed)
      .then(setResult)
      .catch(() => setError("계산 중 오류가 발생했습니다. 다른 조건으로 다시 시도해주세요."))
      .finally(() => setLoading(false));
  }, [base, changed]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!base) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy">조건 하나를 바꾸면 선택지는 얼마나 달라질까요?</h1>
        <p className="mt-2 text-sm text-slate-500">
          현재 조건(예산 {formatManwon(base.budget)} 등)을 기준으로, 조건 하나를 바꿨을 때 실제 실거래 데이터가
          어떻게 달라지는지 계산합니다.
        </p>
      </div>

      <Card className="mt-8">
        <p className="mb-3 text-sm font-semibold text-navy">어떤 조건을 바꿔볼까요?</p>
        <div className="flex flex-wrap gap-2">
          {DIMENSIONS.map((d) => (
            <Chip
              key={d.key}
              selected={dimension === d.key}
              onClick={() => {
                setDimension(d.key);
                setChanged(null);
                setResult(null);
                setError(null);
              }}
            >
              {d.label}
            </Chip>
          ))}
        </div>

        <div className="mt-6 border-t border-border pt-6">
          {dimension === "maxBuildingAge" && (
            <AgeControl base={base} onSelect={setChanged} />
          )}
          {dimension === "minArea" && <AreaControl base={base} onSelect={setChanged} />}
          {dimension === "budget" && <BudgetControl base={base} onSelect={setChanged} />}
          {dimension === "district" && (
            <DistrictControl
              base={base}
              pickedDistrict={pickedDistrict}
              setPickedDistrict={setPickedDistrict}
              onSelect={setChanged}
            />
          )}
          {dimension === "buildingType" && (
            <BuildingTypeControl
              base={base}
              pickedType={pickedType}
              setPickedType={setPickedType}
              onSelect={setChanged}
            />
          )}
        </div>
      </Card>

      {loading && <p className="mt-6 text-center text-sm text-slate-500">계산 중...</p>}

      {error && !loading && (
        <Card className="mt-6 bg-bad-bg text-center text-sm text-bad-text">{error}</Card>
      )}

      {result && !loading && !error && (
        <div className="mt-8 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <DeltaStat
              label="선택 가능한 지역"
              from={`${result.base.districtsWithMatches}개`}
              to={`${result.changed.districtsWithMatches}개`}
              deltaLabel={formatSignedCount(result.delta.districtsWithMatches, "개")}
            />
            <DeltaStat
              label="조건에 맞는 거래"
              from={`${result.base.matchingCount.toLocaleString("ko-KR")}건`}
              to={`${result.changed.matchingCount.toLocaleString("ko-KR")}건`}
              deltaLabel={formatSignedCount(result.delta.matchingCount)}
            />
            <DeltaStat
              label="중앙 확보 면적"
              from={result.base.medianArea !== null ? formatArea(result.base.medianArea) : "-"}
              to={result.changed.medianArea !== null ? formatArea(result.changed.medianArea) : "-"}
              deltaLabel={result.delta.medianArea !== null ? formatSignedArea(result.delta.medianArea) : null}
            />
            <DeltaStat
              label="중앙 거래가격"
              from={result.base.medianPrice !== null ? formatManwon(result.base.medianPrice) : "-"}
              to={result.changed.medianPrice !== null ? formatManwon(result.changed.medianPrice) : "-"}
              deltaLabel={result.delta.medianPrice !== null ? formatSignedManwon(result.delta.medianPrice) : null}
            />
            <DeltaStat
              label="중앙 건물연식"
              from={formatYear(result.base.medianAge)}
              to={formatYear(result.changed.medianAge)}
              deltaLabel={result.delta.medianAge !== null ? formatSignedYear(result.delta.medianAge) : null}
            />
          </div>

          {result.summary.length > 0 ? (
            <Card className="bg-brand-light">
              <p className="text-sm font-medium text-navy">{buildHeadline(result)}</p>
            </Card>
          ) : (
            <p className="text-center text-sm text-slate-500">선택한 두 조건 사이에 차이가 없습니다.</p>
          )}
        </div>
      )}

      <div className="mt-10 text-center">
        <LinkButton href="/finance" variant="secondary">
          금융 시뮬레이션으로 이동
        </LinkButton>
      </div>
    </div>
  );
}

/**
 * "~하지만"처럼 두 지표를 항상 대조 관계로 단정하지 않는다 — 조건에 따라 면적과
 * 연식이 같은 방향(둘 다 유리해짐)으로 움직일 수도 있으므로, 사실만 나열하고
 * 접속사로 인과·대조를 임의로 붙이지 않는다.
 */
function buildHeadline(result: TradeoffResult): string {
  const parts: string[] = [];
  if (result.delta.medianArea !== null && result.delta.medianArea !== 0) {
    parts.push(`약 ${Math.abs(result.delta.medianArea).toFixed(1)}㎡ ${result.delta.medianArea > 0 ? "더 넓은" : "더 좁은"} 주택을 선택할 수 있습니다`);
  }
  if (result.delta.medianAge !== null && result.delta.medianAge !== 0) {
    parts.push(`중앙 건물연식은 약 ${Math.abs(result.delta.medianAge)}년 ${result.delta.medianAge > 0 ? "증가" : "감소"}합니다`);
  }
  if (parts.length === 0) {
    return result.summary[0] ?? "";
  }
  return parts.join(", ") + ".";
}

function AgeControl({ base, onSelect }: { base: UserPreferences; onSelect: (p: UserPreferences) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">현재: {base.maxBuildingAge ? `${base.maxBuildingAge}년 이하` : "상관없음"}</p>
      <div className="flex flex-wrap gap-2">
        {AGE_OPTIONS.map((v) => (
          <Chip key={String(v)} selected={false} onClick={() => onSelect({ ...base, maxBuildingAge: v })}>
            {v ? `${v}년 이하와 비교` : "상관없음과 비교"}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function AreaControl({ base, onSelect }: { base: UserPreferences; onSelect: (p: UserPreferences) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">현재: {base.minArea ? `${base.minArea}㎡ 이상` : "상관없음"}</p>
      <div className="flex flex-wrap gap-2">
        {AREA_OPTIONS.map((v) => (
          <Chip key={String(v)} selected={false} onClick={() => onSelect({ ...base, minArea: v })}>
            {v ? `${v}㎡와 비교` : "상관없음과 비교"}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function BudgetControl({ base, onSelect }: { base: UserPreferences; onSelect: (p: UserPreferences) => void }) {
  const options = useMemo(
    () =>
      [base.budget - 5000, base.budget + 5000, base.budget + 10000].filter((v) => v > 0),
    [base.budget],
  );
  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">현재: {formatManwon(base.budget)}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((v) => (
          <Chip key={v} selected={false} onClick={() => onSelect({ ...base, budget: v })}>
            {formatManwon(v)}와 비교
          </Chip>
        ))}
      </div>
    </div>
  );
}

function DistrictControl({
  base,
  pickedDistrict,
  setPickedDistrict,
  onSelect,
}: {
  base: UserPreferences;
  pickedDistrict: string;
  setPickedDistrict: (d: string) => void;
  onSelect: (p: UserPreferences) => void;
}) {
  const hasFixedDistrict = (base.preferredDistricts?.length ?? 0) > 0;
  if (hasFixedDistrict) {
    return (
      <div>
        <p className="mb-2 text-xs text-slate-500">현재: {base.preferredDistricts!.join(", ")}로 고정</p>
        <Chip selected={false} onClick={() => onSelect({ ...base, preferredDistricts: [] })}>
          서울 전체로 비교
        </Chip>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">현재: 서울 전체</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pickedDistrict}
          onChange={(e) => setPickedDistrict(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          {SEOUL_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <Chip selected={false} onClick={() => onSelect({ ...base, preferredDistricts: [pickedDistrict] })}>
          {pickedDistrict}로 좁혀서 비교
        </Chip>
      </div>
    </div>
  );
}

function BuildingTypeControl({
  base,
  pickedType,
  setPickedType,
  onSelect,
}: {
  base: UserPreferences;
  pickedType: (typeof BUILDING_TYPES)[number];
  setPickedType: (t: (typeof BUILDING_TYPES)[number]) => void;
  onSelect: (p: UserPreferences) => void;
}) {
  const hasFixedType = (base.preferredBuildingTypes?.length ?? 0) > 0;
  if (hasFixedType) {
    return (
      <div>
        <p className="mb-2 text-xs text-slate-500">현재: {base.preferredBuildingTypes!.join(", ")}만</p>
        <Chip selected={false} onClick={() => onSelect({ ...base, preferredBuildingTypes: [] })}>
          전체 유형과 비교
        </Chip>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-2 text-xs text-slate-500">현재: 모든 유형</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={pickedType}
          onChange={(e) => setPickedType(e.target.value as (typeof BUILDING_TYPES)[number])}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          {BUILDING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Chip selected={false} onClick={() => onSelect({ ...base, preferredBuildingTypes: [pickedType] })}>
          {pickedType}만으로 좁혀서 비교
        </Chip>
      </div>
    </div>
  );
}
