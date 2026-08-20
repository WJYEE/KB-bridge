"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "예산에 맞는 거래 찾기",
  "지역별 공간 효율 비교",
  "건물연식 비교",
  "시장 안정성 분석",
  "추천 결과 만들기",
];

/** 계산 자체는 빠르지만(<1초), 무엇을 분석하는지 보여주기 위해 단계를 순차 표시한다. 과도한 인위적 지연은 넣지 않는다(기획 §13). */
export function AnalyzingChecklist() {
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDoneCount((c) => (c < STEPS.length ? c + 1 : c));
    }, 260);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="mb-6 text-base font-semibold text-navy">실거래 데이터를 확인하고 있어요</p>
      <ul className="flex flex-col gap-2 text-left text-sm">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span className={i < doneCount ? "text-good-text" : "text-slate-500"}>{i < doneCount ? "✓" : "◌"}</span>
            <span className={i < doneCount ? "text-navy" : "text-slate-500"}>{step}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
