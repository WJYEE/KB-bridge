"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { runRecommendation } from "@/app/actions";
import { AnalyzingChecklist } from "@/components/result/AnalyzingChecklist";
import { ProfileHeader } from "@/components/result/ProfileHeader";
import { RecommendationCard } from "@/components/result/RecommendationCard";
import { CompareTable } from "@/components/result/CompareTable";
import { EmptyState } from "@/components/result/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { loadAssessment, saveAssessment, saveFinanceContext } from "@/lib/assessment/storage";
import { classifyPersonaLabel } from "@/lib/recommendation/persona-label";
import { formatCount, formatManwon } from "@/lib/format";
import type { RecommendationResult, UserPreferences } from "@/lib/recommendation/types";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compareSet, setCompareSet] = useState<string[]>([]);

  const runFor = useCallback((prefs: UserPreferences, presetId?: string) => {
    setResult(null);
    setError(null);
    saveAssessment({ prefs, presetId });
    runRecommendation(prefs)
      .then(setResult)
      .catch(() => setError("분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
  }, []);

  // sessionStorage(클라이언트 전용)에서 읽어와 최초 분석을 실행하는 정상적인
  // "외부 시스템 동기화" 패턴이라 set-state-in-effect 규칙을 비활성화한다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = loadAssessment();
    if (!stored) {
      router.replace("/assessment");
      return;
    }
    runFor(stored.prefs, stored.presetId);
  }, [router, runFor]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (error) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-sm text-bad">{error}</p>
        <LinkButton href="/assessment" className="mt-4 inline-flex">
          다시 입력하기
        </LinkButton>
      </div>
    );
  }

  if (!result) return <AnalyzingChecklist />;

  const persona = classifyPersonaLabel(result.normalizedWeights);
  const eligibleDistricts = 25 - result.meta.districtsWithInsufficientData;
  const compareCandidates = result.recommendations.filter((r) => compareSet.includes(r.district));

  function toggleCompare(district: string) {
    setCompareSet((prev) =>
      prev.includes(district) ? prev.filter((d) => d !== district) : prev.length < 3 ? [...prev, district] : prev,
    );
  }

  function goToFinance(district: string, housePrice: number) {
    saveFinanceContext({ district, housePrice, equity: result?.profile.cash });
    router.push("/finance");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <ProfileHeader persona={persona} />

      <Card className="mt-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <StatTile size="md" value={formatManwon(result.profile.budget)} label="예산" />
          <StatTile
            size="md"
            value={result.profile.minArea ? `${result.profile.minArea}㎡` : "상관없음"}
            label="최소면적"
          />
          <StatTile size="md" value={`${eligibleDistricts}개`} label="추천 가능 지역" />
          <StatTile size="md" value={`${formatCount(result.meta.transactionCount)}건`} label="분석 거래" />
        </div>
      </Card>

      {result.recommendations.length === 0 ? (
        <EmptyState prefs={result.profile} onRelax={(next) => runFor(next)} />
      ) : (
        <>
          {result.recommendations.length < 5 && (
            <Card className="mt-8 bg-warn-bg text-sm text-amber-900">
              조건에 맞는 신뢰할 수 있는 지역이 {result.recommendations.length}개뿐입니다. 조건을 완화하면 더 많은
              지역을 비교할 수 있습니다.
            </Card>
          )}

          <div className="mt-10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">추천 지역 TOP {result.recommendations.length}</h2>
            {compareSet.length >= 2 && (
              <a href="#compare" className="text-sm font-medium text-brand hover:underline">
                지역 비교하기 ({compareSet.length}) ↓
              </a>
            )}
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {result.recommendations.map((rec, i) => (
              <RecommendationCard
                key={rec.district}
                rank={i + 1}
                rec={rec}
                compareChecked={compareSet.includes(rec.district)}
                onToggleCompare={() => toggleCompare(rec.district)}
                compareDisabled={compareSet.length >= 3}
                onSimulateFinance={() => goToFinance(rec.district, rec.stats.medianAffordablePrice)}
              />
            ))}
          </div>

          {compareCandidates.length >= 2 && (
            <div id="compare" className="mt-10 scroll-mt-20">
              <CompareTable districts={compareCandidates} />
            </div>
          )}

          <Card className="mt-10 flex flex-col items-center gap-3 text-center">
            <p className="text-base font-semibold text-navy">조건 하나를 바꾸면 결과가 얼마나 달라질까요?</p>
            <p className="text-sm text-slate-500">
              신축 조건을 완화하거나 지역을 넓히면 선택지가 어떻게 바뀌는지 Trade-off Simulator에서 확인해보세요.
            </p>
            <LinkButton href="/tradeoff">Trade-off Simulator 열기</LinkButton>
          </Card>
        </>
      )}
    </div>
  );
}
