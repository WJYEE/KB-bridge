import { Chip } from "./Chip";
import { BUDGET_PRESETS, type AssessmentFormState } from "./state";
import { formatManwon } from "@/lib/format";

export function BudgetStep({
  value,
  onChange,
}: {
  value: AssessmentFormState;
  onChange: (patch: Partial<AssessmentFormState>) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-navy">첫 주택에 사용할 수 있는 예산은 어느 정도인가요?</h2>
        <p className="mt-1 text-sm text-slate-500">최대 구매 예산 기준으로 실거래 데이터를 분석합니다.</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-navy">최대 구매 예산</p>
        <div className="flex flex-wrap gap-2">
          {BUDGET_PRESETS.map((p) => (
            <Chip key={p.value} selected={value.budget === p.value} onClick={() => onChange({ budget: p.value })}>
              {p.label}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            value={value.budget}
            onChange={(e) => onChange({ budget: Math.max(0, Number(e.target.value)) })}
            onFocus={(e) => e.target.select()}
            aria-label="최대 구매 예산 (만원)"
            className="w-40 rounded-lg border border-border px-3 py-2 text-sm tabular-nums focus:border-brand focus:outline-none"
          />
          <span className="text-sm text-slate-500">= {formatManwon(value.budget)}</span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-navy">보유 자기자본</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            value={value.cash}
            onChange={(e) => onChange({ cash: Math.max(0, Number(e.target.value)) })}
            onFocus={(e) => e.target.select()}
            aria-label="보유 자기자본 (만원)"
            className="w-40 rounded-lg border border-border px-3 py-2 text-sm tabular-nums focus:border-brand focus:outline-none"
          />
          <span className="text-sm text-slate-500">만원 = {formatManwon(value.cash)}</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">금융 시뮬레이션(/finance)에서 대출 필요액 계산에 사용됩니다.</p>
      </div>
    </div>
  );
}
