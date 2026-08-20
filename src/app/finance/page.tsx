"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Chip } from "@/components/assessment/Chip";
import { loadAssessment, loadFinanceContext } from "@/lib/assessment/storage";
import { calculateFinance, classifyReadiness, type ReadinessTier } from "@/lib/finance/calc";
import { formatManwon, formatPercent } from "@/lib/format";

const RATE_PRESETS = [3.5, 4.0, 4.5, 5.0, 5.5];
const TERM_PRESETS = [10, 15, 20, 30];

const TIER_STYLE: Record<ReadinessTier, string> = {
  BUY: "border-good bg-good-bg text-good-text",
  WAIT: "border-warn bg-warn-bg text-warn-text",
  RENT_GROW: "border-bad bg-bad-bg text-bad-text",
};

export default function FinancePage() {
  const [housePrice, setHousePrice] = useState(30000);
  const [equity, setEquity] = useState(8000);
  const [ratePercent, setRatePercent] = useState(4.5);
  const [years, setYears] = useState(30);
  const [monthlyIncome, setMonthlyIncome] = useState<number | undefined>(undefined);
  const [contextDistrict, setContextDistrict] = useState<string | null>(null);

  // sessionStorage는 클라이언트에만 존재하므로 SSR과의 하이드레이션 불일치를 피하려면
  // 마운트 이후 effect에서 읽어와 state에 반영해야 한다 (렌더 중 직접 접근 시 서버/클라이언트
  // 출력이 달라짐) — "외부 시스템과의 동기화"에 해당하는 정상 패턴이라 규칙을 비활성화한다.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const financeCtx = loadFinanceContext();
    if (financeCtx) {
      setHousePrice(financeCtx.housePrice);
      if (financeCtx.equity !== undefined) setEquity(financeCtx.equity);
      setContextDistrict(financeCtx.district);
      return;
    }
    const assessment = loadAssessment();
    if (assessment) {
      setHousePrice(assessment.prefs.budget);
      if (assessment.prefs.cash !== undefined) setEquity(assessment.prefs.cash);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const result = useMemo(
    () => calculateFinance({ housePrice, equity, annualRatePercent: ratePercent, years, monthlyIncome }),
    [housePrice, equity, ratePercent, years, monthlyIncome],
  );
  const readiness = classifyReadiness(result);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy">이 선택, 실제로 감당할 수 있을까요?</h1>
        {contextDistrict && (
          <p className="mt-2 text-sm text-slate-500">
            {contextDistrict} 예산 이내 중앙 거래가격을 주택가격으로 불러왔습니다. 직접 수정할 수 있습니다.
          </p>
        )}
      </div>

      <Card className="mt-8 flex flex-col gap-6">
        <NumberField id="house-price" label="주택가격 (만원)" value={housePrice} onChange={setHousePrice} />
        <NumberField id="equity" label="자기자본 (만원)" value={equity} onChange={setEquity} />

        <div>
          <p className="mb-2 text-sm font-semibold text-navy">대출금리 (연, %)</p>
          <div className="flex flex-wrap items-center gap-2">
            {RATE_PRESETS.map((r) => (
              <Chip key={r} selected={ratePercent === r} onClick={() => setRatePercent(r)}>
                {r}%
              </Chip>
            ))}
            <input
              type="number"
              step={0.1}
              min={0}
              value={ratePercent}
              onChange={(e) => setRatePercent(Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              aria-label="대출금리 직접입력 (%)"
              className="w-24 rounded-lg border border-border px-3 py-2 text-sm tabular-nums focus:border-brand focus:outline-none"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-navy">대출기간</p>
          <div className="flex flex-wrap gap-2">
            {TERM_PRESETS.map((y) => (
              <Chip key={y} selected={years === y} onClick={() => setYears(y)}>
                {y}년
              </Chip>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">원리금균등상환 기준으로 계산합니다.</p>
        </div>

        <NumberField
          id="monthly-income"
          label="월 소득 (만원, 선택)"
          value={monthlyIncome ?? 0}
          onChange={(v) => setMonthlyIncome(v > 0 ? v : undefined)}
          optional
        />
      </Card>

      <Card className="mt-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          <StatTile size="md" value={formatManwon(result.loanAmount)} label="필요 대출" />
          <StatTile size="md" value={`약 ${formatManwon(result.monthlyPayment)}`} label="예상 월 상환액" />
          <StatTile size="md" value={`약 ${formatManwon(result.totalInterest)}`} label="총 예상 이자" />
          <StatTile size="md" value={formatManwon(result.annualPayment)} label="연간 상환액" />
          <StatTile size="md" value={formatPercent(result.equityRatio)} label="자기자본 비율" />
          {result.dtiRatio !== null && (
            <StatTile size="md" value={formatPercent(result.dtiRatio)} label="월 소득 대비 상환 부담" />
          )}
        </div>
      </Card>

      <div className="mt-6">
        <Disclaimer>
          본 결과는 입력한 금리와 기간을 기준으로 한 단순 시뮬레이션이며 실제 대출 가능 금액, 금리 및 조건은
          금융기관 심사에 따라 달라질 수 있습니다.
        </Disclaimer>
      </div>

      <Card className={`mt-8 border-2 ${TIER_STYLE[readiness.tier]}`}>
        <p className="text-sm font-bold">{readiness.label}</p>
        <p className="mt-1 text-sm">{readiness.message}</p>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ConceptCard
          active={readiness.tier === "BUY"}
          title="BUY"
          desc="현재 조건에서 구매 시뮬레이션을 진행합니다."
        />
        <ConceptCard
          active={readiness.tier === "WAIT"}
          title="WAIT"
          desc="자기자본을 더 확보한 뒤 재분석하는 것을 고려합니다."
        />
        <ConceptCard
          active={readiness.tier === "RENT_GROW"}
          title="RENT & GROW"
          desc="현재 구매 대신 임대·자산 형성 시나리오를 참고합니다."
        />
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">
        참고용 개념 미리보기입니다 — 자기자본 비율·소득 대비 상환 부담만 반영한 단순 기준이며, 정식 추천
        알고리즘은 다음 단계에서 고도화될 예정입니다.
      </p>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  optional,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-navy">
        {label}
        {optional && <span className="ml-1 text-xs font-normal text-slate-500">(선택)</span>}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={500}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        onFocus={(e) => e.target.select()}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm tabular-nums focus:border-brand focus:outline-none sm:w-56"
      />
      <p className="mt-1 text-xs text-slate-500">{formatManwon(value)}</p>
    </div>
  );
}

// opacity로 비활성 카드를 흐리게 하면 텍스트 대비까지 함께 깨지므로, 선택/비선택을
// 별도 색상 조합으로 구분한다 (대비 기준을 충족하는 slate-600/700만 사용).
function ConceptCard({ active, title, desc }: { active: boolean; title: string; desc: string }) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm ${active ? "border-brand bg-brand-light" : "border-border bg-white"}`}
    >
      <p className={`font-bold ${active ? "text-navy" : "text-slate-600"}`}>{title}</p>
      <p className={`mt-1 ${active ? "text-slate-700" : "text-slate-600"}`}>{desc}</p>
    </div>
  );
}
