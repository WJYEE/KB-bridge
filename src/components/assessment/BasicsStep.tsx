import { Chip } from "./Chip";
import { FLOOR_PREFERENCE_OPTIONS, MAX_AGE_PRESETS, MIN_AREA_PRESETS, type AssessmentFormState } from "./state";
import { BUILDING_TYPES, SEOUL_DISTRICTS } from "@/lib/realestate/types";
import { formatPyeong } from "@/lib/format";

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function BasicsStep({
  value,
  onChange,
}: {
  value: AssessmentFormState;
  onChange: (patch: Partial<AssessmentFormState>) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-navy">어떤 조건의 집을 찾고 계신가요?</h2>
        <p className="mt-1 text-sm text-slate-500">선택하지 않으면 &ldquo;상관없음&rdquo;으로 분석합니다.</p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-navy">희망 지역</p>
          {value.preferredDistricts.length > 0 && (
            <button
              type="button"
              onClick={() => onChange({ preferredDistricts: [] })}
              className="text-xs font-medium text-brand hover:underline"
            >
              전체 선택 해제 (서울 전체)
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {SEOUL_DISTRICTS.map((d) => (
            <Chip
              key={d}
              selected={value.preferredDistricts.includes(d)}
              onClick={() => onChange({ preferredDistricts: toggle(value.preferredDistricts, d) })}
            >
              {d}
            </Chip>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {value.preferredDistricts.length === 0
            ? "서울 전체 25개 자치구를 분석합니다."
            : `${value.preferredDistricts.length}개 지역 선택됨 — 다음 단계에서 "지역" 중요도를 높여야 이 선택이 추천 순위에 우선 반영됩니다.`}
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-navy">최소 희망 면적</p>
        <div className="flex flex-wrap gap-2">
          {MIN_AREA_PRESETS.map((p) => (
            <Chip key={p.label} selected={value.minArea === p.value} onClick={() => onChange({ minArea: p.value })}>
              {p.label}
              {p.value !== undefined && <span className="ml-1 text-xs">({formatPyeong(p.value)})</span>}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-navy">건물연식</p>
        <div className="flex flex-wrap gap-2">
          {MAX_AGE_PRESETS.map((p) => (
            <Chip
              key={p.label}
              selected={value.maxBuildingAge === p.value}
              onClick={() => onChange({ maxBuildingAge: p.value })}
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-navy">주택유형</p>
        <div className="flex flex-wrap gap-2">
          {BUILDING_TYPES.map((t) => (
            <Chip
              key={t}
              selected={value.preferredBuildingTypes.includes(t)}
              onClick={() => onChange({ preferredBuildingTypes: toggle(value.preferredBuildingTypes, t) })}
            >
              {t}
            </Chip>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {value.preferredBuildingTypes.length === 0 ? "모든 유형을 분석합니다." : `${value.preferredBuildingTypes.length}개 유형 선택됨`}
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-navy">층</p>
        <div className="flex flex-wrap gap-2">
          {FLOOR_PREFERENCE_OPTIONS.map((f) => (
            <Chip key={f} selected={value.floorPreference === f} onClick={() => onChange({ floorPreference: f })}>
              {f}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
