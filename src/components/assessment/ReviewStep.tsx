import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { AssessmentFormState } from "./state";
import { formatArea, formatManwon, formatPyeong } from "@/lib/format";

function Stars({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value / 20)));
  return (
    <span aria-label={`5점 만점에 ${filled}점`} className="tracking-widest text-brand">
      {"★".repeat(filled)}
      <span className="text-slate-300">{"☆".repeat(5 - filled)}</span>
    </span>
  );
}

export function ReviewStep({
  value,
  onSubmit,
  submitting,
}: {
  value: AssessmentFormState;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy">입력하신 조건을 확인해주세요</h2>
        <p className="mt-1 text-sm text-slate-500">아래 조건으로 실거래 데이터를 분석합니다.</p>
      </div>

      <Card>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">최대 예산</dt>
            <dd className="mt-0.5 font-semibold text-navy">{formatManwon(value.budget)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">자기자본</dt>
            <dd className="mt-0.5 font-semibold text-navy">{formatManwon(value.cash)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">최소 면적</dt>
            <dd className="mt-0.5 font-semibold text-navy">
              {value.minArea ? `${formatArea(value.minArea)} (${formatPyeong(value.minArea)})` : "상관없음"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">건물연식</dt>
            <dd className="mt-0.5 font-semibold text-navy">
              {value.maxBuildingAge ? `${value.maxBuildingAge}년 이하` : "상관없음"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">지역</dt>
            <dd className="mt-0.5 font-semibold text-navy">
              {value.preferredDistricts.length > 0 ? value.preferredDistricts.join(", ") : "서울 전체"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">주택유형</dt>
            <dd className="mt-0.5 font-semibold text-navy">
              {value.preferredBuildingTypes.length > 0 ? value.preferredBuildingTypes.join(", ") : "상관없음"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">층</dt>
            <dd className="mt-0.5 font-semibold text-navy">{value.floorPreference}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-semibold text-navy">선호 중요도</p>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">가격</span>
            <Stars value={value.weights.price ?? 0} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">공간</span>
            <Stars value={value.weights.space ?? 0} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">신축</span>
            <Stars value={value.weights.newness ?? 0} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-slate-500">안정성</span>
            <Stars value={value.weights.stability ?? 0} />
          </div>
        </div>
      </Card>

      <Button onClick={onSubmit} disabled={submitting} className="w-full">
        {submitting ? "분석 중..." : "실거래 데이터로 분석하기"}
      </Button>
    </div>
  );
}
