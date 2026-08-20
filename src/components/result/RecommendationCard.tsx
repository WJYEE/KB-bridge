"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Button } from "@/components/ui/Button";
import { formatArea, formatManwon } from "@/lib/format";
import type { DistrictRecommendation } from "@/lib/recommendation/types";

const SCORE_LABELS: Record<keyof DistrictRecommendation["scores"], string> = {
  price: "예산 적합도",
  space: "공간 효율",
  newness: "신축 적합도",
  district: "지역 적합도",
  buildingType: "주택유형 적합도",
  floor: "층 적합도",
  stability: "시장 안정성",
  liquidity: "거래 활성도",
};

export function RecommendationCard({
  rank,
  rec,
  compareChecked,
  onToggleCompare,
  compareDisabled,
  onSimulateFinance,
}: {
  rank: number;
  rec: DistrictRecommendation;
  compareChecked: boolean;
  onToggleCompare: () => void;
  compareDisabled: boolean;
  onSimulateFinance: () => void;
}) {
  const [scoresOpen, setScoresOpen] = useState(false);

  return (
    <Card className="flex flex-col gap-5">
      {/* 1. 지역 */}
      <div className="flex items-start justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-bold text-slate-500">{String(rank).padStart(2, "0")}</span>
          <h3 className="text-xl font-bold text-navy">{rec.district}</h3>
        </div>
        <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand-dark">
          적합도 {rec.totalScore.toFixed(1)}
        </span>
      </div>

      {/* 2. 왜 추천됐는가 (가장 먼저, 가장 크게) */}
      <div className="rounded-xl bg-surface-alt p-4">
        <p className="mb-2 text-sm font-bold text-navy">왜 {rec.district}인가요?</p>
        <ul className="flex flex-col gap-1.5 text-sm text-slate-700">
          {rec.reasons.map((r, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-good-text">✓</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. 핵심 숫자 */}
      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">예산 이내 중앙가격</dt>
          <dd className="font-semibold text-navy">{formatManwon(rec.stats.medianAffordablePrice)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">예산 이내 중앙면적</dt>
          <dd className="font-semibold text-navy">{formatArea(rec.stats.medianAffordableArea)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">거래건수</dt>
          <dd className="font-semibold text-navy">{rec.stats.affordableCount.toLocaleString("ko-KR")}건</dd>
        </div>
      </dl>

      {/* 4. Trade-off */}
      {(rec.tradeoffs.length > 0 || rec.weaknesses.length > 0) && (
        <div className="border-t border-border pt-4">
          <p className="mb-1.5 text-xs font-semibold text-slate-500">대신</p>
          <ul className="flex flex-col gap-1 text-sm text-slate-600">
            {rec.tradeoffs.map((t, i) => (
              <li key={`t-${i}`} className="flex gap-1.5">
                <span className="text-warn-text">△</span>
                <span>{t}</span>
              </li>
            ))}
            {rec.weaknesses.map((w, i) => (
              <li key={`w-${i}`} className="flex gap-1.5">
                <span className="text-warn-text">△</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. 세부 점수 (기본 접힘) */}
      <div className="border-t border-border pt-4">
        <button
          type="button"
          onClick={() => setScoresOpen((v) => !v)}
          aria-expanded={scoresOpen}
          className="text-xs font-semibold text-brand hover:underline"
        >
          {scoresOpen ? "세부 점수 접기 ▲" : "세부 점수 8종 보기 ▼"}
        </button>
        {scoresOpen && (
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2.5">
            {(Object.keys(rec.scores) as (keyof typeof rec.scores)[]).map((key) => (
              <ScoreBar key={key} label={SCORE_LABELS[key]} value={rec.scores[key]} />
            ))}
          </div>
        )}
      </div>

      {/* 6. Sample / Confidence */}
      <ConfidenceBadge confidence={rec.confidence} sampleSize={rec.sampleSize} />

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={compareChecked}
            disabled={!compareChecked && compareDisabled}
            onChange={onToggleCompare}
            className="h-4 w-4 accent-brand"
          />
          비교에 추가
        </label>
        <Button variant="secondary" className="ml-auto px-4 py-2 text-xs" onClick={onSimulateFinance}>
          이 지역으로 금융 시뮬레이션
        </Button>
      </div>
    </Card>
  );
}
