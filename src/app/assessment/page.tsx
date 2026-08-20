"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressSteps } from "@/components/ui/ProgressSteps";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BudgetStep } from "@/components/assessment/BudgetStep";
import { BasicsStep } from "@/components/assessment/BasicsStep";
import { WeightsStep } from "@/components/assessment/WeightsStep";
import { ReviewStep } from "@/components/assessment/ReviewStep";
import { DEFAULT_FORM_STATE, toUserPreferences, type AssessmentFormState } from "@/components/assessment/state";
import { saveAssessment } from "@/lib/assessment/storage";

const STEP_LABELS = ["예산", "주거 조건", "중요도", "최종 확인"];

// 자기자본이 예산보다 큰 경우는 "대출 없이 전액 현금으로 구매"하는 정상적인
// 상황이므로 막지 않는다 (finance 계산도 loanAmount=max(0, price-equity)로
// 이 경우를 자연스럽게 0원 대출로 처리한다).
function validateStep(step: number, form: AssessmentFormState): string | null {
  if (step === 1) {
    if (!Number.isFinite(form.budget) || form.budget <= 0) return "최대 구매 예산을 입력해주세요.";
    if (!Number.isFinite(form.cash) || form.cash < 0) return "자기자본은 0 이상이어야 합니다.";
  }
  return null;
}

export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AssessmentFormState>(DEFAULT_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function patch(p: Partial<AssessmentFormState>) {
    setForm((prev) => ({ ...prev, ...p }));
  }

  function handleSubmit() {
    setSubmitting(true);
    saveAssessment({ prefs: toUserPreferences(form), presetId: form.presetId });
    router.push("/result");
  }

  const validationError = validateStep(step, form);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <ProgressSteps total={4} current={step} labels={STEP_LABELS} />

      <Card className="mt-8">
        {step === 1 && <BudgetStep value={form} onChange={patch} />}
        {step === 2 && <BasicsStep value={form} onChange={patch} />}
        {step === 3 && <WeightsStep value={form} onChange={patch} />}
        {step === 4 && <ReviewStep value={form} onSubmit={handleSubmit} submitting={submitting} />}
      </Card>

      {step < 4 && (
        <div className="mt-6 flex flex-col gap-2">
          {validationError && <p className="text-right text-xs text-bad">{validationError}</p>}
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
              이전
            </Button>
            <Button
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={validationError !== null}
            >
              다음
            </Button>
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="mt-6">
          <Button variant="secondary" onClick={() => setStep(3)}>
            이전
          </Button>
        </div>
      )}
    </div>
  );
}
